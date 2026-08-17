/**
 * Unit tests for the pure trading-math functions (lib/trading/engine.ts)
 * that back /api/positions and /api/portfolio — and, transitively, the
 * new Wallet page's "Est. Total Value" and "Unrealized PnL". No DB, no
 * network, no React: plain functions over plain numbers, same style as
 * tests/markets-derive.test.ts. This file didn't exist before the Wallet
 * task even though the functions did — Wallet's total-value/PnL
 * requirements are exactly what these already cover.
 */
import { describe, expect, it } from "vitest";
import {
  calculateUnrealizedPnl,
  calculatePnlPercent,
  calculatePortfolioSummary,
} from "@/lib/trading/engine";

describe("calculateUnrealizedPnl", () => {
  it("is positive for a LONG position when price rose (the spec's own example)", () => {
    // 0.1 BTC opened at $60,000, now $63,000 -> +$300
    expect(calculateUnrealizedPnl("LONG", 0.1, 60000, 63000)).toBeCloseTo(300, 6);
  });

  it("is negative for a LONG position when price fell", () => {
    expect(calculateUnrealizedPnl("LONG", 0.1, 60000, 57000)).toBeCloseTo(-300, 6);
  });

  it("is positive for a SHORT position when price fell", () => {
    expect(calculateUnrealizedPnl("SHORT", 0.1, 60000, 57000)).toBeCloseTo(300, 6);
  });

  it("is negative for a SHORT position when price rose", () => {
    expect(calculateUnrealizedPnl("SHORT", 0.1, 60000, 63000)).toBeCloseTo(-300, 6);
  });

  it("does not treat a LONG and a SHORT the same for an identical price move", () => {
    const long = calculateUnrealizedPnl("LONG", 0.1, 60000, 63000);
    const short = calculateUnrealizedPnl("SHORT", 0.1, 60000, 63000);
    expect(long).toBe(-short);
  });
});

describe("calculatePnlPercent", () => {
  it("scales with leverage, directionally aware", () => {
    const longPct = calculatePnlPercent("LONG", 60000, 63000, 10);
    const shortPct = calculatePnlPercent("SHORT", 60000, 63000, 10);
    expect(longPct).toBeCloseTo(50, 6); // (3000/60000)*10*100
    expect(shortPct).toBeCloseTo(-50, 6);
  });
});

describe("calculatePortfolioSummary", () => {
  it("total value = balance when there are no open positions (spec section 16)", () => {
    const summary = calculatePortfolioSummary(3342.21, 0, []);
    expect(summary.equity).toBeCloseTo(3342.21, 6);
    expect(summary.unrealizedPnl).toBe(0);
  });

  it("total value = balance + current value contributed by open positions (spec section 4)", () => {
    // Available balance $3,342.21, one open position currently worth
    // +$500 of unrealized PnL -> total $3,842.21.
    const summary = calculatePortfolioSummary(3342.21, 0, [
      { margin: 100, unrealizedPnl: 500 },
    ]);
    expect(summary.equity).toBeCloseTo(3842.21, 6);
  });

  it("subtracts losing positions from total value", () => {
    const summary = calculatePortfolioSummary(1000, 0, [
      { margin: 100, unrealizedPnl: -200 },
    ]);
    expect(summary.equity).toBeCloseTo(800, 6);
  });

  it("sums margin and PnL across multiple open positions", () => {
    const summary = calculatePortfolioSummary(1000, 0, [
      { margin: 100, unrealizedPnl: 50 },
      { margin: 200, unrealizedPnl: -20 },
    ]);
    expect(summary.usedMargin).toBe(300);
    expect(summary.unrealizedPnl).toBe(30);
    expect(summary.equity).toBe(1030);
    expect(summary.freeMargin).toBe(730);
  });
});
