import { describe, expect, it } from "vitest";
import { computeWeeklyPnl } from "@/lib/spot/weekly-pnl";

const WINDOW_START = new Date("2026-08-27T00:00:00Z");
const BEFORE_WINDOW = new Date("2026-08-01T00:00:00Z");
const DAY_3 = new Date("2026-08-29T00:00:00Z");

describe("computeWeeklyPnl — 7-day price performance of CURRENTLY HELD crypto only", () => {
  it("A: current quantity is 0 -> always exactly 0, no matter what the fill history says (a real 1500 buy/sell round-trip included)", () => {
    const result = computeWeeklyPnl(
      [
        { side: "BUY", price: 1500, filledQuantity: 1, at: BEFORE_WINDOW },
        { side: "SELL", price: 1480, filledQuantity: 1, at: DAY_3 },
      ],
      0,
      99999,
      99999,
      WINDOW_START
    );
    expect(result.pnl).toBe(0);
    expect(result.baselineValue).toBe(0);
  });

  it("B: held the full 7 days, price rose -> positive P/L", () => {
    const result = computeWeeklyPnl(
      [{ side: "BUY", price: 65000, filledQuantity: 0.1, at: BEFORE_WINDOW }],
      0.1,
      75000,
      70000,
      WINDOW_START
    );
    expect(result.pnl).toBeCloseTo(0.1 * (75000 - 70000), 6); // 500 — from window-start price, not the real 65,000 purchase
    expect(result.baselineValue).toBeCloseTo(0.1 * 70000, 6);
  });

  it("C: held the full 7 days, price fell -> negative P/L", () => {
    const result = computeWeeklyPnl(
      [{ side: "BUY", price: 65000, filledQuantity: 0.1, at: BEFORE_WINDOW }],
      0.1,
      65000,
      70000,
      WINDOW_START
    );
    expect(result.pnl).toBeCloseTo(0.1 * (65000 - 70000), 6); // -500
  });

  it("D: bought during the window and still held -> measured from its own real purchase price, not the window-start reference", () => {
    const result = computeWeeklyPnl(
      [{ side: "BUY", price: 72000, filledQuantity: 0.1, at: DAY_3 }],
      0.1,
      75000,
      59000, // irrelevant — nothing existed before this purchase
      WINDOW_START
    );
    expect(result.pnl).toBeCloseTo(0.1 * (75000 - 72000), 6); // 300, not 0.1*(75000-59000)
  });

  it("F: a partial sell leaves only the remaining quantity contributing", () => {
    const result = computeWeeklyPnl(
      [
        { side: "BUY", price: 60000, filledQuantity: 1, at: BEFORE_WINDOW },
        { side: "SELL", price: 62000, filledQuantity: 0.8, at: DAY_3 },
      ],
      0.2,
      63000,
      61000,
      WINDOW_START
    );
    expect(result.pnl).toBeCloseTo(0.2 * (63000 - 61000), 6); // 400 — the sold 0.8's result is absent
  });

  it("G: quantity with no real fill history at all (e.g. an admin credit), even though currently held, contributes 0 P/L", () => {
    const result = computeWeeklyPnl([], 2, 80000, 79000, WINDOW_START);
    expect(result.pnl).toBe(0);
  });

  it("a pre-window position blended with an in-window purchase: each layer measured from its own correct reference", () => {
    const result = computeWeeklyPnl(
      [
        { side: "BUY", price: 55000, filledQuantity: 0.02, at: BEFORE_WINDOW },
        { side: "BUY", price: 60000, filledQuantity: 0.01, at: DAY_3 },
      ],
      0.03,
      62000,
      58000,
      WINDOW_START
    );
    // 0.02 carried through: 0.02*(62000-58000)=80; 0.01 bought in-window: 0.01*(62000-60000)=20.
    expect(result.pnl).toBeCloseTo(100, 6);
  });

  it("never fabricates a short position: a before-window SELL exceeding real prior buys clamps at 0", () => {
    const result = computeWeeklyPnl(
      [
        { side: "SELL", price: 60000, filledQuantity: 5, at: BEFORE_WINDOW },
        { side: "BUY", price: 60000, filledQuantity: 1, at: DAY_3 },
      ],
      1,
      61000,
      60000,
      WINDOW_START
    );
    expect(Number.isFinite(result.pnl)).toBe(true);
    expect(result.pnl).toBeCloseTo(1000, 6); // the whole 1 unit is treated as bought in-window
  });

  it("baselineValue is 0 whenever currentQuantity is 0 (percent denominator never misleads on a closed position)", () => {
    const result = computeWeeklyPnl(
      [{ side: "BUY", price: 60000, filledQuantity: 1, at: BEFORE_WINDOW }],
      0,
      62000,
      61000,
      WINDOW_START
    );
    expect(result.baselineValue).toBe(0);
    expect(result.pnl).toBe(0);
  });
});
