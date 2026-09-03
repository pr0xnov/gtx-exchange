/**
 * Integration tests for GET /api/account/weekly-pnl against a real
 * Postgres test DB, exercising the real Spot order route so cost/fill
 * history comes from genuine fills, not hand-built fixtures — same
 * approach as tests/account-summary-endpoint.test.ts. The one external
 * dependency (historical price via lib/binance/client.ts's fetchKlines)
 * is stubbed, the same way tests/binance-klines-intervals.test.ts already
 * stubs the same Binance REST call — these test symbols were never real
 * Binance pairs, so the real endpoint would 400 on them regardless.
 *
 * This endpoint measures ONLY the 7-day price performance of crypto
 * CURRENTLY held — never trading/realized performance. A sold/closed
 * position (current balance 0) always contributes exactly 0, regardless
 * of what it was worth or what it sold for.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { GET as getWeeklyPnl } from "@/app/api/account/weekly-pnl/route";
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

// symbol -> { historical, current } close prices. A symbol with no entry
// simulates "not a real/currently-listed Binance pair" (real behavior —
// verified live: Binance 400s on an unknown symbol).
const priceBySymbol = new Map<string, { historical: number; current: number }>();

function klineRow(close: number): unknown[] {
  return [
    0,
    String(close),
    String(close),
    String(close),
    String(close),
    "1",
    0,
    "0",
    0,
    "0",
    "0",
    "0",
  ];
}

beforeEach(async () => {
  await resetDatabase();
  vi.mocked(requireUser).mockReset();
  priceBySymbol.clear();

  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const parsed = new URL(url);
      const symbol = parsed.searchParams.get("symbol") ?? "";
      const isHistorical = parsed.searchParams.has("endTime");
      const prices = priceBySymbol.get(symbol);

      if (!prices) {
        return Promise.resolve({ ok: false, status: 400 } as Response);
      }
      const close = isHistorical ? prices.historical : prices.current;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([klineRow(close)]),
      } as Response);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function readWeeklyPnl(): Promise<{ pnl: number; percent: number }> {
  const json = (await (await getWeeklyPnl()).json()) as {
    success: boolean;
    data: { pnl: number; percent: number };
  };
  return json.data;
}

// Backdates a real BUY fill so it's treated as "before the window" — a
// genuine pre-window position, as opposed to a bare seedSpotWallet
// balance (no fill at all), which now correctly contributes 0 (see "G").
async function buyBeforeWindow(symbol: string, quantity: number) {
  const res = await spotOrder(
    jsonRequest("http://test/api/spot/orders", {
      symbol,
      side: "BUY",
      type: "MARKET",
      quantity,
    })
  );
  const { data } = (await res.json()) as { data: { id: string } };
  await prisma.spotOrder.update({
    where: { id: data.id },
    data: { updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  });
}

describe("GET /api/account/weekly-pnl — A: no current crypto holdings -> a clean 0/0%", () => {
  it("no crypto assets and no activity at all", async () => {
    const user = await seedUserWithWallet(0);
    vi.mocked(requireUser).mockResolvedValue(user);

    const result = await readWeeklyPnl();
    expect(result).toEqual({ pnl: 0, percent: 0 });
  });

  it("a deposit alone (USDT only, no crypto) never appears as profit", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 250 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const result = await readWeeklyPnl();
    expect(result).toEqual({ pnl: 0, percent: 0 });
  });

  it("a withdrawal alone never appears as a loss", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 0 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const result = await readWeeklyPnl();
    expect(result).toEqual({ pnl: 0, percent: 0 });
  });

  it("E: a fully sold/closed position (current balance 0) contributes 0, however large its real trade history was", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100_000 });
    const asset = await seedAsset(60000, "CLOSEDCUSDT");
    priceBySymbol.set("CLOSEDCUSDT", { historical: 60000, current: 78000 });
    vi.mocked(requireUser).mockResolvedValue(user);

    await buyBeforeWindow("CLOSEDCUSDT", 1);
    await prisma.asset.update({ where: { id: asset.id }, data: { lastPrice: 78000 } });
    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "CLOSEDCUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 1,
      })
    );

    const result = await readWeeklyPnl();
    expect(result).toEqual({ pnl: 0, percent: 0 });
  });
});

describe("GET /api/account/weekly-pnl — B/C: a position held the full 7 days shows only its price move", () => {
  it("B: price rose -> positive weekly P/L", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100_000 });
    await seedAsset(60000, "RISECUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);
    await buyBeforeWindow("RISECUSDT", 1);

    priceBySymbol.set("RISECUSDT", { historical: 60000, current: 62000 });

    const result = await readWeeklyPnl();
    expect(result.pnl).toBeCloseTo(2000, 6);
    expect(result.percent).toBeGreaterThan(0);
  });

  it("C: price fell -> negative weekly P/L", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100_000 });
    await seedAsset(60000, "FALLCUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);
    await buyBeforeWindow("FALLCUSDT", 1);

    priceBySymbol.set("FALLCUSDT", { historical: 60000, current: 58000 });

    const result = await readWeeklyPnl();
    expect(result.pnl).toBeCloseTo(-2000, 6);
    expect(result.percent).toBeLessThan(0);
  });

  it("skips a held currency whose historical price can't be fetched, rather than crashing the whole response", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "UNLISTEDC", balance: 1 });
    // Deliberately no priceBySymbol entry -> simulates a delisted/unknown pair.
    vi.mocked(requireUser).mockResolvedValue(user);

    const result = await readWeeklyPnl();
    expect(result).toEqual({ pnl: 0, percent: 0 });
  });
});

describe("GET /api/account/weekly-pnl — D/F: quantity acquired or reduced during the window", () => {
  it("D: bought during the window and still held -> measured from the real purchase price, not the window-start reference", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100_000 });
    const asset = await seedAsset(72000, "BOUGHTINWUSDT");
    priceBySymbol.set("BOUGHTINWUSDT", { historical: 59000, current: 75000 });
    vi.mocked(requireUser).mockResolvedValue(user);

    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "BOUGHTINWUSDT",
        side: "BUY",
        type: "MARKET",
        quantity: 0.1,
      })
    );
    await prisma.asset.update({ where: { id: asset.id }, data: { lastPrice: 75000 } });

    const result = await readWeeklyPnl();
    // (75,000 - 72,000) * 0.1 = 300 — never against the irrelevant 59,000
    // window-start reference, since this quantity didn't exist before it
    // was bought.
    expect(result.pnl).toBeCloseTo(300, 6);
  });

  it("F: a partial sell leaves only the remaining quantity contributing", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100_000 });
    const asset = await seedAsset(60000, "PARTIALCUSDT");
    priceBySymbol.set("PARTIALCUSDT", { historical: 61000, current: 63000 });
    vi.mocked(requireUser).mockResolvedValue(user);

    await buyBeforeWindow("PARTIALCUSDT", 1);
    await prisma.asset.update({ where: { id: asset.id }, data: { lastPrice: 62000 } });
    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "PARTIALCUSDT",
        side: "SELL",
        type: "MARKET",
        quantity: 0.8,
      })
    );

    const result = await readWeeklyPnl();
    // Only the remaining 0.2 participates: 0.2 * (63,000 - 61,000) = 400.
    // The sold 0.8's result never appears here.
    expect(result.pnl).toBeCloseTo(400, 6);
  });
});

describe("GET /api/account/weekly-pnl — G: admin/seed quantity never fabricates P/L", () => {
  it("a balance with no real SpotOrder fill history at all, still currently held, contributes 0", async () => {
    const user = await seedUserWithWallet(0);
    await seedAsset(80000, "ADMWPNLUSDT");
    // Balance exists with NO SpotOrder ever having created it — simulates
    // an admin BalanceAdjustment credit or a demo/seed balance that's
    // still sitting in the wallet.
    await seedSpotWallet({ userId: user.id, currency: "ADMWPNL", balance: 2 });
    priceBySymbol.set("ADMWPNLUSDT", { historical: 80000, current: 77000 });
    vi.mocked(requireUser).mockResolvedValue(user);

    const result = await readWeeklyPnl();
    expect(result.pnl).toBe(0);
  });

  it("the same untracked balance, later sold via a real order, still contributes 0", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 100_000 });
    await seedAsset(80000, "ADMWPNL2USDT");
    await seedSpotWallet({ userId: user.id, currency: "ADMWPNL2", balance: 2 });
    priceBySymbol.set("ADMWPNL2USDT", { historical: 80000, current: 77000 });
    vi.mocked(requireUser).mockResolvedValue(user);

    await spotOrder(
      jsonRequest("http://test/api/spot/orders", {
        symbol: "ADMWPNL2USDT",
        side: "SELL",
        type: "MARKET",
        quantity: 2,
      })
    );

    const result = await readWeeklyPnl();
    expect(result.pnl).toBe(0);
  });
});
