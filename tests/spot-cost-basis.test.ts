/**
 * Unit tests for the weighted-average Spot cost-basis engine
 * (lib/spot/cost-basis.ts). Pure — no DB, no React.
 */
import { describe, expect, it } from "vitest";
import { computeSpotCostBasis } from "@/lib/spot/cost-basis";

describe("computeSpotCostBasis — unrealized PnL on a held position", () => {
  it("matches the spec's own example: bought at $60,000, now $63,000 -> +$3,000", () => {
    const result = computeSpotCostBasis(
      [{ side: "BUY", price: 60_000, filledQuantity: 1 }],
      1,
      63_000
    );
    expect(result.costBasis).toBeCloseTo(60_000, 6);
    expect(result.unrealizedPnl).toBeCloseTo(3_000, 6);
    expect(result.realizedPnl).toBe(0);
  });

  it("matches the spec's loss example: bought at $60,000, now $58,000 -> -$2,000", () => {
    const result = computeSpotCostBasis(
      [{ side: "BUY", price: 60_000, filledQuantity: 1 }],
      1,
      58_000
    );
    expect(result.unrealizedPnl).toBeCloseTo(-2_000, 6);
  });

  it("is exactly $0 with no fills and no holding", () => {
    const result = computeSpotCostBasis([], 0, 63_000);
    expect(result.costBasis).toBe(0);
    expect(result.unrealizedPnl).toBe(0);
    expect(result.realizedPnl).toBe(0);
  });
});

describe("computeSpotCostBasis — weighted-average cost across multiple buys", () => {
  it("averages two buys at different prices", () => {
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 50_000, filledQuantity: 1 },
        { side: "BUY", price: 70_000, filledQuantity: 1 },
      ],
      2,
      70_000
    );
    // avg cost = (50,000 + 70,000) / 2 = 60,000
    expect(result.costBasis).toBeCloseTo(120_000, 6);
    expect(result.unrealizedPnl).toBeCloseTo(20_000, 6); // 140,000 - 120,000
  });
});

describe("computeSpotCostBasis — realized PnL from a sell", () => {
  it("matches the spec's own example: bought at $60,000, sold at $61,000 -> realized +$1,000/unit", () => {
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 60_000, filledQuantity: 1 },
        { side: "SELL", price: 61_000, filledQuantity: 1 },
      ],
      0,
      61_000
    );
    expect(result.realizedPnl).toBeCloseTo(1_000, 6);
    expect(result.costBasis).toBe(0); // nothing held anymore
    expect(result.unrealizedPnl).toBe(0);
  });

  it("is realized profit, not just holding an appreciated asset (buying alone never realizes anything)", () => {
    const stillHolding = computeSpotCostBasis(
      [{ side: "BUY", price: 60_000, filledQuantity: 1 }],
      1,
      65_000
    );
    expect(stillHolding.realizedPnl).toBe(0);
  });

  it("realizes a loss when sold below average cost", () => {
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 60_000, filledQuantity: 1 },
        { side: "SELL", price: 55_000, filledQuantity: 1 },
      ],
      0,
      55_000
    );
    expect(result.realizedPnl).toBeCloseTo(-5_000, 6);
  });

  it("keeps the same average cost for a remaining balance after a partial sell", () => {
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 60_000, filledQuantity: 2 },
        { side: "SELL", price: 61_000, filledQuantity: 1 },
      ],
      1,
      63_000
    );
    expect(result.realizedPnl).toBeCloseTo(1_000, 6); // (61,000-60,000)*1
    expect(result.costBasis).toBeCloseTo(60_000, 6); // avg cost unchanged, 1 unit left
    expect(result.unrealizedPnl).toBeCloseTo(3_000, 6); // 63,000 - 60,000
  });

  it("starts a brand-new average cost after a full exit, unaffected by the old one", () => {
    // Fully exit a position bought at 60,000, then buy back in at a very
    // different price — the new cost basis must be the new price alone,
    // not blended with the old (already-closed-out) position.
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 60_000, filledQuantity: 1 },
        { side: "SELL", price: 65_000, filledQuantity: 1 }, // fully exits, +5,000 realized
        { side: "BUY", price: 20_000, filledQuantity: 1 }, // brand-new position
      ],
      1,
      20_000
    );
    expect(result.realizedPnl).toBeCloseTo(5_000, 6); // only from the first round trip
    expect(result.costBasis).toBeCloseTo(20_000, 6); // fresh basis, not blended with 60,000
    expect(result.unrealizedPnl).toBeCloseTo(0, 6); // price hasn't moved since the new buy
  });

  it("accumulates realized PnL across several round trips", () => {
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 100, filledQuantity: 1 },
        { side: "SELL", price: 110, filledQuantity: 1 }, // +10
        { side: "BUY", price: 90, filledQuantity: 1 },
        { side: "SELL", price: 80, filledQuantity: 1 }, // -10
      ],
      0,
      100
    );
    expect(result.realizedPnl).toBeCloseTo(0, 6);
  });
});

describe("computeSpotCostBasis — untraceable (e.g. seeded/demo) balances never fabricate a gain", () => {
  it("prices an entirely untracked holding at its current price, giving exactly $0 unrealized PnL", () => {
    const result = computeSpotCostBasis([], 13, 604.4);
    expect(result.unrealizedPnl).toBe(0);
    expect(result.costBasis).toBeCloseTo(13 * 604.4, 6);
  });

  it("prices only the unexplained surplus at current price when real orders cover part of the balance", () => {
    // Real trace: bought 1 at $60,000. Wallet actually holds 3 (2 more
    // came from somewhere untracked, e.g. a seed script) at $63,000 now.
    const result = computeSpotCostBasis(
      [{ side: "BUY", price: 60_000, filledQuantity: 1 }],
      3,
      63_000
    );
    // 1 unit's real gain: (63,000-60,000)*1 = 3,000. The other 2 units
    // are priced at current price -> $0 PnL each. Total unrealized: 3,000.
    expect(result.unrealizedPnl).toBeCloseTo(3_000, 6);
  });

  it("never sells more than the running tracked quantity (a stray extra SELL fill is capped)", () => {
    const result = computeSpotCostBasis(
      [
        { side: "BUY", price: 100, filledQuantity: 1 },
        { side: "SELL", price: 120, filledQuantity: 5 }, // more than ever bought
      ],
      0,
      120
    );
    expect(result.realizedPnl).toBeCloseTo(20, 6); // only the 1 real unit counted
  });
});
