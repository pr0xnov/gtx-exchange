/**
 * Integration tests for GET /api/account/summary against a real
 * Postgres test DB — the one shared source of Balance/Equity/Profit for
 * Account, Wallet, and Trading's header. Exercises the real Spot order
 * route (app/api/spot/orders/route.ts) so cost-basis/PnL is derived
 * from genuine fills, not hand-built fixtures.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { GET as getAccountSummary } from "@/app/api/account/summary/route";
import { POST as spotOrder } from "@/app/api/spot/orders/route";
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

interface SummaryResponse {
  balance: number;
  equity: number;
  profit: number;
  spotAssets: {
    currency: string;
    amount: number;
    currentPrice: number;
    value: number;
    costBasis: number;
    unrealizedPnl: number;
    realizedPnl: number;
  }[];
}

async function readSummary(): Promise<SummaryResponse> {
  const json = (await (await getAccountSummary()).json()) as {
    success: boolean;
    data: SummaryResponse;
  };
  return json.data;
}

describe("GET /api/account/summary — Balance", () => {
  it("is only the Spot USDT wallet's balance, no crypto", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 361.44 });
    await seedSpotWallet({ userId: user.id, currency: "BTC", balance: 0.01 });
    await seedAsset(100_000, "BTCUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.balance).toBeCloseTo(361.44, 6); // BTC's $1,000 is NOT here
  });

  it("is unaffected by a nonzero Credit on the margin wallet", async () => {
    const user = await seedUserWithWallet(3000);
    await prisma.wallet.update({ where: { userId: user.id }, data: { credit: 500 } });
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 200 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.balance).toBe(200);
  });

  it("completely ignores the margin/futures Wallet.balance — this is the exact bug that made Account's Balance disagree with Trading's Available", async () => {
    // A large margin balance must have zero effect: Spot orders can
    // never touch it (app/api/spot/orders/route.ts only ever
    // debits/credits SpotWallet), so it must never be counted as
    // spendable Spot cash.
    const user = await seedUserWithWallet(999_999);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 200 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.balance).toBe(200);
  });
});

describe("GET /api/account/summary — Equity", () => {
  it("matches the spec's own worked example: 3,000 Spot USDT + 0.01 BTC ($1,000) + 0.5 ETH ($2,000) = 6,000", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 3_000 });
    await seedSpotWallet({ userId: user.id, currency: "BTC", balance: 0.01 });
    await seedSpotWallet({ userId: user.id, currency: "ETH", balance: 0.5 });
    await seedAsset(100_000, "BTCUSDT");
    await seedAsset(4_000, "ETHUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.equity).toBeCloseTo(6000, 6);
  });

  it("is completely unaffected by an open Futures position or the margin wallet", async () => {
    const user = await seedUserWithWallet(1_000_000); // large margin balance, must be ignored
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1000 });
    const asset = await seedAsset(50_000, "FUTNOOPUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    await prisma.position.create({
      data: {
        userId: user.id,
        assetId: asset.id,
        side: "LONG",
        amount: 1,
        leverage: 10,
        entryPrice: 50_000,
        currentPrice: 60_000,
        margin: 5_000,
        status: "OPEN",
      },
    });

    const summary = await readSummary();
    expect(summary.balance).toBe(1000);
    expect(summary.equity).toBe(1000); // neither the margin balance nor the $10,000 unrealized futures gain is here
  });
});

describe("GET /api/account/summary — Profit (real Spot trading result)", () => {
  it("is $0 when the user has only bought and never sold", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedAsset(60_000, "PROFITBUYUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "PROFITBUYUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.01,
      })
    );

    const summary = await readSummary();
    expect(summary.profit).toBe(0);
    const btc = summary.spotAssets.find((a) => a.currency === "PROFITBUY");
    expect(btc!.unrealizedPnl).toBeCloseTo(0, 6); // price hasn't moved since the buy
  });

  it("matches the spec's own example: buy BTC at $60,000, sell at $61,000 -> real realized profit, not Equity - Balance", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    const asset = await seedAsset(60_000, "REALPROFITUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "REALPROFITUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.01,
      })
    );

    // Price moves to $61,000 before the sell.
    await prisma.asset.update({ where: { id: asset.id }, data: { lastPrice: 61_000 } });

    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "REALPROFITUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.01,
      })
    );

    const summary = await readSummary();
    expect(summary.profit).toBeCloseTo(10, 6); // (61,000-60,000) * 0.01
    expect(summary.equity - summary.balance).not.toBeCloseTo(summary.profit, 2);
  });

  it("prices an untracked (e.g. seeded) balance at current price -> $0 fabricated PnL", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "BNB", balance: 13 });
    await seedAsset(600, "BNBUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    const bnb = summary.spotAssets.find((a) => a.currency === "BNB");
    expect(bnb!.unrealizedPnl).toBe(0);
    expect(bnb!.value).toBeCloseTo(13 * 600, 6);
    expect(summary.profit).toBe(0);
  });
});

describe("GET /api/account/summary — Spot BUY/SELL still atomic and balance-checked", () => {
  it("rejects a BUY when Spot USDT is insufficient, summary unaffected", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 10 });
    await seedAsset(50_000, "SUMMARYPOORUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const res = await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "SUMMARYPOORUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 1,
      })
    );
    expect(res.status).toBe(400);

    const summary = await readSummary();
    expect(summary.balance).toBe(10);
  });
});

describe("GET /api/account/summary — a fully-sold asset disappears from My Assets", () => {
  it("1. amount > 0 -> the asset is present in spotAssets", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "BTC", balance: 0.01 });
    await seedAsset(60_000, "BTCUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.spotAssets.find((a) => a.currency === "BTC")).toBeDefined();
  });

  it("2. amount = 0 -> the asset is absent from spotAssets, even though its SpotWallet row and registry support still exist", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "BTC", balance: 0 });
    await seedAsset(60_000, "BTCUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.spotAssets.find((a) => a.currency === "BTC")).toBeUndefined();

    // Not deleted from SpotWallet — just filtered out of the display list.
    const wallet = await prisma.spotWallet.findUnique({
      where: { userId_currency: { userId: user.id, currency: "BTC" } },
    });
    expect(wallet).not.toBeNull();
  });

  it("3-6. BUY -> appears, partial SELL -> remains, full SELL -> disappears, BUY again -> reappears with a fresh cost basis", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 10_000 });
    const asset = await seedAsset(60_000, "ZEROFLOWUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    // 3. BUY -> appears.
    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "ZEROFLOWUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.01,
      })
    );
    let summary = await readSummary();
    let row = summary.spotAssets.find((a) => a.currency === "ZEROFLOW");
    expect(row).toBeDefined();
    expect(row!.amount).toBeCloseTo(0.01, 8);

    // 4. Partial SELL -> remains (still amount > 0).
    await prisma.asset.update({ where: { id: asset.id }, data: { lastPrice: 61_000 } });
    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "ZEROFLOWUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.004,
      })
    );
    summary = await readSummary();
    row = summary.spotAssets.find((a) => a.currency === "ZEROFLOW");
    expect(row).toBeDefined();
    expect(row!.amount).toBeCloseTo(0.006, 8);

    // 5. SELL the remainder -> disappears.
    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "ZEROFLOWUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.006,
      })
    );
    summary = await readSummary();
    expect(summary.spotAssets.find((a) => a.currency === "ZEROFLOW")).toBeUndefined();
    // Profit still reflects the real realized gain from that closed-out
    // position, even though it's no longer listed as an asset.
    expect(summary.profit).toBeCloseTo(10, 6); // (61,000-60,000) x 0.01

    // 6. BUY again, at a very different price -> reappears with a fresh
    // cost basis, not blended with the fully-closed-out position.
    await prisma.asset.update({ where: { id: asset.id }, data: { lastPrice: 30_000 } });
    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "ZEROFLOWUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.02,
      })
    );
    summary = await readSummary();
    row = summary.spotAssets.find((a) => a.currency === "ZEROFLOW");
    expect(row).toBeDefined();
    expect(row!.amount).toBeCloseTo(0.02, 8);
    expect(row!.costBasis).toBeCloseTo(600, 6); // 0.02 x 30,000, fresh basis
    expect(row!.unrealizedPnl).toBeCloseTo(0, 6); // price hasn't moved since this buy
  });

  it("7. Equity is unaffected by an asset with amount = 0", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    await seedSpotWallet({ userId: user.id, currency: "BTC", balance: 0 });
    await seedAsset(60_000, "BTCUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.equity).toBe(1_000); // BTC's 0 balance adds exactly $0
  });

  it("never shows a currency the user has neither traded nor ever held, even though registration pre-seeds a zero-balance SpotWallet row for every SPOT_CURRENCIES entry", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "UNTOUCHED", balance: 0 });
    await seedAsset(1_000, "UNTOUCHEDUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const summary = await readSummary();
    expect(summary.spotAssets.find((a) => a.currency === "UNTOUCHED")).toBeUndefined();
  });
});
