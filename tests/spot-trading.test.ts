/**
 * Correctness + concurrency tests for the spot order routes
 * (app/api/spot/orders, app/api/spot/orders/[id]/cancel). Spot trading
 * settles against a dedicated per-currency SpotWallet ledger (balance +
 * locked), entirely separate from the futures-margin Wallet. Every
 * balance mutation here uses the same atomic conditional-UPDATE pattern
 * established for the leveraged order routes (check-and-write in one
 * statement, inside a transaction) — these tests prove that holds for
 * spot too: MARKET orders can't overdraw/oversell under concurrency, and
 * LIMIT orders correctly reserve and release funds.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { POST as spotOrder } from "@/app/api/spot/orders/route";
import { POST as cancelSpotOrder } from "@/app/api/spot/orders/[id]/cancel/route";
import {
  jsonRequest,
  resetDatabase,
  seedAsset,
  seedSpotWallet,
  seedUserWithWallet,
} from "./helpers";

vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

beforeEach(async () => {
  await resetDatabase();
  vi.mocked(requireUser).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

interface SpotOrderResponse {
  id: string;
  status: string;
  filledQuantity: string;
}

async function readJson(res: Response) {
  return res.json() as Promise<{
    success: boolean;
    data?: SpotOrderResponse;
    error?: string;
  }>;
}

async function walletOf(userId: string, currency: string) {
  return prisma.spotWallet.findUnique({
    where: { userId_currency: { userId, currency } },
  });
}

describe("spot market orders", () => {
  it("BUY debits USDT and credits the base currency, filled immediately", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    const asset = await seedAsset(50_000, "MKTBUYUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "MKTBUYUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.01,
      })
    );
    const json = await readJson(res);
    expect(res.status).toBe(201);
    expect(json.data!.status).toBe("FILLED");
    expect(json.data!.filledQuantity).toBe("0.01");

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.balance)).toBe(500); // 1000 - 0.01*50000
    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base!.balance)).toBe(0.01);
  });

  it("BUY is rejected when USDT balance is insufficient, wallet untouched", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 10 });
    await seedAsset(50_000, "MKTPOORUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "MKTPOORUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
    );
    const json = await readJson(res);
    expect(res.status).toBe(400);
    expect(json.error).toBe("Insufficient balance for this order");

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.balance)).toBe(10);
  });

  it("SELL debits the base currency and credits USDT", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "MKTSELLUSDT"); // baseAsset -> "MKTSELL"
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    await seedSpotWallet({ userId: user.id, currency: asset.baseAsset, balance: 0.02 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "MKTSELLUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.01,
      })
    );
    expect(res.status).toBe(201);

    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base!.balance)).toBe(0.01); // 0.02 - 0.01

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.balance)).toBe(500); // 0 + 0.01*50000
  });

  it("SELL is rejected when the base currency balance is insufficient", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "MKTSHORTUSDT");
    await seedSpotWallet({ userId: user.id, currency: asset.baseAsset, balance: 0.001 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "MKTSHORTUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 1,
      })
    );
    const json = await readJson(res);
    expect(res.status).toBe(400);
    expect(json.error).toBe("Insufficient balance for this order");

    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base!.balance)).toBe(0.001);
  });
});

describe("spot limit orders", () => {
  it("BUY reserves USDT into `locked` and creates an OPEN order", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedAsset(50_000, "LIMBUYUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "LIMBUYUSDT",
        side: "BUY",
        type: "LIMIT",
        quantity: 0.01,
        price: 40_000,
      })
    );
    const json = await readJson(res);
    expect(res.status).toBe(201);
    expect(json.data!.status).toBe("OPEN");
    expect(json.data!.filledQuantity).toBe("0");

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.balance)).toBe(600); // 1000 - 0.01*40000
    expect(Number(usdt!.locked)).toBe(400);
  });

  it("SELL reserves the base currency into `locked`", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "LIMSELLUSDT");
    await seedSpotWallet({ userId: user.id, currency: asset.baseAsset, balance: 0.02 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "LIMSELLUSDT",
        side: "SELL",
        type: "LIMIT",
        quantity: 0.01,
        price: 60_000,
      })
    );
    expect(res.status).toBe(201);

    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base!.balance)).toBe(0.01);
    expect(Number(base!.locked)).toBe(0.01);
  });

  it("rejects a LIMIT order without a price", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedAsset(50_000, "NOPRICEUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "NOPRICEUSDT",
        side: "BUY",
        type: "LIMIT",
        quantity: 0.01,
      })
    );
    expect(res.status).toBe(422);
  });
});

describe("cancelling a spot limit order", () => {
  it("releases the reservation back to available balance", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedAsset(50_000, "CANCELBUYUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const createRes = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "CANCELBUYUSDT",
        side: "BUY",
        type: "LIMIT",
        quantity: 0.01,
        price: 40_000,
      })
    );
    const created = (await readJson(createRes)).data;

    const cancelRes = await cancelSpotOrder(
      new Request("http://test", { method: "POST" }),
      {
        params: Promise.resolve({ id: created!.id }),
      }
    );
    const cancelJson = await readJson(cancelRes);
    expect(cancelRes.status).toBe(200);
    expect(cancelJson.data!.status).toBe("CANCELLED");

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.balance)).toBe(1_000); // fully restored
    expect(Number(usdt!.locked)).toBe(0);
  });

  it("rejects cancelling an order that is no longer open", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedAsset(50_000, "DBLCANCELUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const createRes = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "DBLCANCELUSDT",
        side: "BUY",
        type: "LIMIT",
        quantity: 0.01,
        price: 40_000,
      })
    );
    const created = (await readJson(createRes)).data;

    await cancelSpotOrder(new Request("http://test", { method: "POST" }), {
      params: Promise.resolve({ id: created!.id }),
    });
    const secondRes = await cancelSpotOrder(
      new Request("http://test", { method: "POST" }),
      {
        params: Promise.resolve({ id: created!.id }),
      }
    );
    expect(secondRes.status).toBe(400);

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.locked)).toBe(0); // not double-released
  });
});

describe("concurrent spot market orders for the same user", () => {
  it("BUY: never lets the USDT balance go negative", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100 });
    await seedAsset(75, "RACEBUYUSDT"); // 1 unit costs 75

    vi.mocked(requireUser).mockResolvedValue(user);

    const body = { symbol: "RACEBUYUSDT", side: "BUY", type: "MARKET", quantity: 1 };
    const [resA, resB] = await Promise.all([
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
    ]);

    const succeeded = [resA.status, resB.status].filter((s) => s === 201);
    expect(succeeded).toHaveLength(1);

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt!.balance)).toBe(25); // 100 - 75, exactly one buy went through
    expect(Number(usdt!.balance)).toBeGreaterThanOrEqual(0);
  });

  it("SELL: never lets the base currency balance go negative", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "RACESELLUSDT");
    await seedSpotWallet({ userId: user.id, currency: asset.baseAsset, balance: 0.01 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const body = { symbol: "RACESELLUSDT", side: "SELL", type: "MARKET", quantity: 0.01 };
    const [resA, resB] = await Promise.all([
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
    ]);

    const succeeded = [resA.status, resB.status].filter((s) => s === 201);
    expect(succeeded).toHaveLength(1);

    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base!.balance)).toBe(0);
    expect(Number(base!.balance)).toBeGreaterThanOrEqual(0);
  });
});
