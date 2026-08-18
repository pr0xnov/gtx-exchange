/**
 * Unit tests for the unified financial-summary layer (lib/account/derive.ts)
 * backing Account, Wallet, and Trading's header. No DB, no network, no
 * React — same style as tests/markets-derive.test.ts.
 */
import { describe, expect, it } from "vitest";
import {
  calculateAccountSummary,
  calculateUnrealizedPnlPercent,
} from "@/lib/account/derive";

describe("calculateAccountSummary — Balance", () => {
  it("is only cash, never crypto value", () => {
    const summary = calculateAccountSummary({
      cashBalance: 6361.44,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 0.01,
          value: 1000,
          costBasis: 900,
          unrealizedPnl: 100,
          realizedPnl: 0,
        },
      ],
    });
    expect(summary.balance).toBe(6361.44);
  });

  it("has no Credit input at all — the function's input shape has no such field", () => {
    const summary = calculateAccountSummary({ cashBalance: 500, spotCurrencies: [] });
    expect(summary.balance).toBe(500);
  });
});

describe("calculateAccountSummary — Equity", () => {
  it("matches the spec's own worked example: 6,361.44 cash + BNB 7,850 + BTC 1,743 + DOGE 14 + ETH 19 + LTC 88 + XRP 100", () => {
    const summary = calculateAccountSummary({
      cashBalance: 6361.44,
      spotCurrencies: [
        {
          currency: "BNB",
          amount: 13,
          value: 7850,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "BTC",
          amount: 0.027,
          value: 1743,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "DOGE",
          amount: 200,
          value: 14,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "ETH",
          amount: 0.01,
          value: 19,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "LTC",
          amount: 2,
          value: 88,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
        {
          currency: "XRP",
          amount: 100,
          value: 100,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 0,
        },
      ],
    });
    expect(summary.equity).toBeCloseTo(6361.44 + 7850 + 1743 + 14 + 19 + 88 + 100, 2);
  });

  it("equals Balance exactly when the user holds no Spot crypto", () => {
    const summary = calculateAccountSummary({ cashBalance: 500, spotCurrencies: [] });
    expect(summary.equity).toBe(summary.balance);
  });

  it("has no Futures margin/PnL input at all — the input shape has no such field", () => {
    const summary = calculateAccountSummary({
      cashBalance: 1000,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 0.01,
          value: 500,
          costBasis: 400,
          unrealizedPnl: 100,
          realizedPnl: 0,
        },
      ],
    });
    expect(summary.equity).toBe(1500); // 1000 + 500, nothing else could sneak in
  });

  it("includes a currency's value even if its realizedPnl came from trades that already sold most of it", () => {
    const summary = calculateAccountSummary({
      cashBalance: 0,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 0.5,
          value: 30_000,
          costBasis: 25_000,
          unrealizedPnl: 5_000,
          realizedPnl: 1_000,
        },
      ],
    });
    expect(summary.equity).toBe(30_000);
  });
});

describe("calculateAccountSummary — Profit", () => {
  it("is the sum of realized PnL, not Equity - Balance", () => {
    const summary = calculateAccountSummary({
      cashBalance: 5_000,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 0.1,
          value: 6_300, // Equity - Balance would be 1,300 here
          costBasis: 6_000,
          unrealizedPnl: 300,
          realizedPnl: 1_000, // real, already-banked profit from an earlier sell
        },
      ],
    });
    expect(summary.profit).toBe(1_000);
    expect(summary.equity - summary.balance).not.toBe(summary.profit);
  });

  it("matches the spec's own example: bought BTC at $60,000, sold at $61,000 -> realized profit reflected", () => {
    const summary = calculateAccountSummary({
      cashBalance: 0,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 0,
          value: 0,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 1_000,
        },
      ],
    });
    expect(summary.profit).toBe(1_000);
  });

  it("is $0 when the user has only bought and never sold (no realized profit yet)", () => {
    const summary = calculateAccountSummary({
      cashBalance: 0,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 1,
          value: 63_000,
          costBasis: 60_000,
          unrealizedPnl: 3_000,
          realizedPnl: 0,
        },
      ],
    });
    expect(summary.profit).toBe(0);
  });

  it("sums realized PnL across multiple currencies, including negative results", () => {
    const summary = calculateAccountSummary({
      cashBalance: 0,
      spotCurrencies: [
        {
          currency: "BTC",
          amount: 0,
          value: 0,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: 500,
        },
        {
          currency: "ETH",
          amount: 0,
          value: 0,
          costBasis: 0,
          unrealizedPnl: 0,
          realizedPnl: -200,
        },
      ],
    });
    expect(summary.profit).toBe(300);
  });
});

describe("calculateUnrealizedPnlPercent", () => {
  it("is 0% when nothing is held", () => {
    expect(calculateUnrealizedPnlPercent([])).toBe(0);
  });

  it("is a real ROI figure: unrealized gain / cost basis", () => {
    const pct = calculateUnrealizedPnlPercent([
      {
        currency: "BTC",
        amount: 1,
        value: 63_000,
        costBasis: 60_000,
        unrealizedPnl: 3_000,
        realizedPnl: 0,
      },
    ]);
    expect(pct).toBeCloseTo(5, 6); // 3,000 / 60,000 * 100
  });

  it("blends multiple holdings by total cost basis, not a simple average", () => {
    const pct = calculateUnrealizedPnlPercent([
      {
        currency: "BTC",
        amount: 1,
        value: 110,
        costBasis: 100,
        unrealizedPnl: 10,
        realizedPnl: 0,
      },
      {
        currency: "ETH",
        amount: 1,
        value: 900,
        costBasis: 1_000,
        unrealizedPnl: -100,
        realizedPnl: 0,
      },
    ]);
    expect(pct).toBeCloseTo((-90 / 1100) * 100, 6);
  });
});
