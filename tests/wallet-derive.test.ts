/**
 * Unit tests for the pure Wallet data-shaping helpers (lib/wallet/derive.ts).
 * No DB, no network, no React — same style as tests/markets-derive.test.ts.
 */
import { describe, expect, it } from "vitest";
import {
  buildWalletAssetRows,
  calculateTotalPnlPercent,
  calculateTotalWalletValue,
} from "@/lib/wallet/derive";

const BTC_POSITION = {
  symbol: "BTCUSDT",
  displaySymbol: "BTC/USD",
  side: "LONG" as const,
  amount: 0.1,
  entryPrice: 60000,
  currentPrice: 63000,
  pnl: 300,
  pnlPercent: 5,
};

describe("buildWalletAssetRows", () => {
  it("returns no rows when there are no open positions (spec section 17)", () => {
    expect(buildWalletAssetRows([])).toEqual([]);
  });

  it("resolves a real name and base ticker from the shared market registry", () => {
    const [row] = buildWalletAssetRows([BTC_POSITION]);
    expect(row!.baseAsset).toBe("BTC");
    expect(row!.name).toBe("Bitcoin");
  });

  it("derives value as amount x currentPrice, and passes entryPrice through as cost basis", () => {
    const [row] = buildWalletAssetRows([BTC_POSITION]);
    expect(row!.value).toBeCloseTo(6300, 6); // 0.1 x 63,000
    expect(row!.costBasis).toBe(60000);
  });

  it("trusts the position's own pnl/pnlPercent rather than recomputing them", () => {
    const [row] = buildWalletAssetRows([BTC_POSITION]);
    expect(row!.pnl).toBe(300);
    expect(row!.pnlPercent).toBe(5);
  });

  it("reacts to a changed current price: value and pnl both update from the same input shape", () => {
    const priceUp = buildWalletAssetRows([
      { ...BTC_POSITION, currentPrice: 65000, pnl: 500 },
    ])[0]!;
    const priceDown = buildWalletAssetRows([
      { ...BTC_POSITION, currentPrice: 58000, pnl: -200 },
    ])[0]!;
    expect(priceUp.value).toBeCloseTo(6500, 6);
    expect(priceUp.pnl).toBe(500);
    expect(priceDown.value).toBeCloseTo(5800, 6);
    expect(priceDown.pnl).toBe(-200);
  });
});

describe("calculateTotalPnlPercent", () => {
  it("is 0% with no margin used (no open positions)", () => {
    expect(calculateTotalPnlPercent(0, 0)).toBe(0);
  });

  it("matches the same pnl/margin*100 basis a single position already uses", () => {
    expect(calculateTotalPnlPercent(50, 100)).toBeCloseTo(50, 6);
    expect(calculateTotalPnlPercent(-25, 100)).toBeCloseTo(-25, 6);
  });
});

describe("calculateTotalWalletValue", () => {
  it("is just balance + credit with no open positions (spec section 16)", () => {
    const total = calculateTotalWalletValue({
      balance: 3342.21,
      credit: 0,
      usedMargin: 0,
      unrealizedPnl: 0,
    });
    expect(total).toBeCloseTo(3342.21, 6);
  });

  it("adds back the current value of an open position — margin + its PnL (spec section 4/5)", () => {
    // Balance $3,342.21, one open position currently worth $500
    // (margin + unrealized PnL) -> total $3,842.21.
    const total = calculateTotalWalletValue({
      balance: 3342.21,
      credit: 0,
      usedMargin: 400,
      unrealizedPnl: 100,
    });
    expect(total).toBeCloseTo(3842.21, 6);
  });

  it("is unchanged by opening a position at zero PnL (margin debited from balance is added back)", () => {
    // Mirrors the real app: opening a position immediately debits its
    // margin from wallet.balance. Net worth shouldn't move just because
    // some of it got reallocated to margin at zero PnL.
    const before = calculateTotalWalletValue({
      balance: 3342.21285,
      credit: 0,
      usedMargin: 0,
      unrealizedPnl: 0,
    });
    const afterOpening = calculateTotalWalletValue({
      balance: 3342.21285 - 126.68476, // debited by margin
      credit: 0,
      usedMargin: 126.68476,
      unrealizedPnl: 0,
    });
    expect(afterOpening).toBeCloseTo(before, 6);
  });

  it("falls as an open position loses value", () => {
    const total = calculateTotalWalletValue({
      balance: 1000,
      credit: 0,
      usedMargin: 100,
      unrealizedPnl: -30,
    });
    expect(total).toBeCloseTo(1070, 6);
  });
});
