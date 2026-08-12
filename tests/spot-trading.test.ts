/**
 * Correctness + concurrency tests for the new spot order routes
 * (app/api/spot/orders). Spot buy/sell uses the same atomic
 * conditional-UPDATE pattern established for the leveraged order routes
 * (checked-and-write in one statement, inside a transaction) specifically
 * to avoid reintroducing the balance/overselling races that pattern was
 * built to close — these tests prove that holds here too.
 *
 * Requires the disposable Postgres in docker-compose.test.yml:
 *   docker compose -f docker-compose.test.yml up -d
 *   npm test
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { POST as spotOrder } from "@/app/api/spot/orders/route";
import {
  jsonRequest,
  resetDatabase,
  seedAsset,
  seedSpotHolding,
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

async function readJson(res: Response) {
  return res.json() as Promise<{ success: boolean; data?: unknown; error?: string }>;
}

describe("spot buy", () => {
  it("debits the wallet and credits a holding at the current asset price", async () => {
    const user = await seedUserWithWallet(1_000);
    const asset = await seedAsset(50_000, "SPOTBUYUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "SPOTBUYUSDT",
        side: "BUY",
        quantity: 0.01,
      })
    );
    expect(res.status).toBe(201);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(wallet.balance)).toBe(1_000 - 0.01 * 50_000); // 500

    const holding = await prisma.spotHolding.findUniqueOrThrow({
      where: { userId_assetId: { userId: user.id, assetId: asset.id } },
    });
    expect(Number(holding.quantity)).toBe(0.01);
  });

  it("rejects a buy that would exceed the wallet balance", async () => {
    const user = await seedUserWithWallet(100);
    await seedAsset(50_000, "SPOTPOORUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "SPOTPOORUSDT",
        side: "BUY",
        quantity: 1, // 1 * 50000 = 50000, way over the 100 balance
      })
    );
    const json = await readJson(res);
    expect(res.status).toBe(400);
    expect(json.error).toBe("Insufficient balance for this purchase");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(wallet.balance)).toBe(100); // untouched
  });
});

describe("spot sell", () => {
  it("credits the wallet and debits the holding", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "SPOTSELLUSDT");
    await seedSpotHolding({ userId: user.id, assetId: asset.id, quantity: 0.02 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "SPOTSELLUSDT",
        side: "SELL",
        quantity: 0.01,
      })
    );
    expect(res.status).toBe(201);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(wallet.balance)).toBe(500); // 0 + 0.01 * 50000

    const holding = await prisma.spotHolding.findUniqueOrThrow({
      where: { userId_assetId: { userId: user.id, assetId: asset.id } },
    });
    expect(Number(holding.quantity)).toBe(0.01); // 0.02 - 0.01
  });

  it("rejects selling more than is held (no shorting in spot mode)", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "SPOTSHORTUSDT");
    await seedSpotHolding({ userId: user.id, assetId: asset.id, quantity: 0.005 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "SPOTSHORTUSDT",
        side: "SELL",
        quantity: 1,
      })
    );
    const json = await readJson(res);
    expect(res.status).toBe(400);
    expect(json.error).toBe("Insufficient balance for this sale");

    const holding = await prisma.spotHolding.findUniqueOrThrow({
      where: { userId_assetId: { userId: user.id, assetId: asset.id } },
    });
    expect(Number(holding.quantity)).toBe(0.005); // untouched
  });
});

describe("concurrent spot buys for the same user", () => {
  it("never lets the wallet balance go negative", async () => {
    const user = await seedUserWithWallet(100);
    await seedAsset(75, "SPOTRACEBUYUSDT"); // 1 unit costs 75

    vi.mocked(requireUser).mockResolvedValue(user);

    // Two concurrent buys of 75 each = 150 total, over the 100 balance:
    // only one can possibly be funded.
    const body = { symbol: "SPOTRACEBUYUSDT", side: "BUY" as const, quantity: 1 };

    const [resA, resB] = await Promise.all([
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
    ]);

    const succeeded = [resA.status, resB.status].filter((s) => s === 201);
    const rejected = [resA.status, resB.status].filter((s) => s === 400);
    expect(succeeded).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(wallet.balance)).toBe(25); // 100 - 75, exactly one buy went through
    expect(Number(wallet.balance)).toBeGreaterThanOrEqual(0);
  });
});

describe("concurrent spot sells for the same user", () => {
  it("never lets the holding quantity go negative", async () => {
    const user = await seedUserWithWallet(0);
    const asset = await seedAsset(50_000, "SPOTRACESELLUSDT");
    await seedSpotHolding({ userId: user.id, assetId: asset.id, quantity: 0.01 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const body = { symbol: "SPOTRACESELLUSDT", side: "SELL" as const, quantity: 0.01 };

    const [resA, resB] = await Promise.all([
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
      spotOrder(jsonRequest("http://test/api/spot/orders", body)),
    ]);

    const succeeded = [resA.status, resB.status].filter((s) => s === 201);
    const rejected = [resA.status, resB.status].filter((s) => s === 400);
    expect(succeeded).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const holding = await prisma.spotHolding.findUniqueOrThrow({
      where: { userId_assetId: { userId: user.id, assetId: asset.id } },
    });
    expect(Number(holding.quantity)).toBe(0);
    expect(Number(holding.quantity)).toBeGreaterThanOrEqual(0);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    expect(Number(wallet.balance)).toBe(500); // credited exactly once
  });
});
