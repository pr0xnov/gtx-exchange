/**
 * Real cost-basis / PnL accounting for Spot holdings, derived from a
 * user's actual filled SpotOrder history. No cost-basis field exists
 * anywhere in the schema (SpotWallet is a plain quantity ledger — see
 * lib/spot/wallet.ts), so this reconstructs it deterministically from
 * real BUY/SELL fills using weighted-average cost, the standard method
 * (not FIFO/LIFO, but the same "one running average" approach most
 * simple portfolio trackers use) — nothing here is invented or mocked.
 *
 * Pure — no DB, no React. app/api/account/summary/route.ts supplies the
 * real fills (ordered chronologically) and current balance/price.
 */

export interface SpotFillLike {
  side: "BUY" | "SELL";
  price: number;
  filledQuantity: number;
}

export interface SpotCostBasisResult {
  /** Current holding's cost basis (avgCost × currentQuantity). */
  costBasis: number;
  /** currentQuantity × currentPrice − costBasis. */
  unrealizedPnl: number;
  /** Cumulative realized PnL from every SELL in `fills`, regardless of
   *  whether any of this currency is still held. */
  realizedPnl: number;
}

/**
 * `fills` must already be sorted oldest-first (e.g. by SpotOrder.updatedAt
 * ascending — the effective fill time for both MARKET orders, which fill
 * in the same request, and LIMIT orders, which fill later via
 * server/ws/fill-spot-order.ts).
 *
 * `currentQuantity` is the real, authoritative holding right now
 * (SpotWallet.balance + locked) — used to reconcile against what the
 * fill history explains. If it's short-sold past reconstructed history
 * something's inconsistent, but the tracked amount can never exceed it.
 * If it's LARGER than history explains — e.g. a demo/seeded balance that
 * predates any real order (see prisma/seed.ts) — the unexplained surplus
 * is priced at `currentPrice` (i.e. contributes exactly $0 to
 * unrealizedPnl) rather than defaulting to a $0 cost basis, which would
 * fabricate a large fake gain out of nothing.
 */
export function computeSpotCostBasis(
  fills: SpotFillLike[],
  currentQuantity: number,
  currentPrice: number
): SpotCostBasisResult {
  let qty = 0;
  let avgCost = 0;
  let realizedPnl = 0;

  for (const fill of fills) {
    if (fill.filledQuantity <= 0) continue;

    if (fill.side === "BUY") {
      const totalCostBefore = avgCost * qty;
      const newQty = qty + fill.filledQuantity;
      avgCost =
        newQty > 0 ? (totalCostBefore + fill.price * fill.filledQuantity) / newQty : 0;
      qty = newQty;
    } else {
      const sellQty = Math.min(fill.filledQuantity, qty);
      realizedPnl += (fill.price - avgCost) * sellQty;
      qty -= sellQty;
    }
  }

  let finalAvgCost = avgCost;
  if (currentQuantity > qty) {
    const surplus = currentQuantity - qty;
    const totalCost = avgCost * qty + currentPrice * surplus;
    finalAvgCost = currentQuantity > 0 ? totalCost / currentQuantity : 0;
  }

  const costBasis = finalAvgCost * currentQuantity;
  const unrealizedPnl = currentQuantity * currentPrice - costBasis;

  return { costBasis, unrealizedPnl, realizedPnl };
}
