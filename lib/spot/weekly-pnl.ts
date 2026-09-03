/**
 * 7-day price performance of the crypto assets a user CURRENTLY holds —
 * Account's "Прибыль / Убыток за 7 дней". Deliberately NOT trading
 * performance: a sold/closed position contributes nothing here at all,
 * regardless of its real realized result (that belongs to trade
 * history, not this account-summary card) — only whatever's still held
 * right now is priced, and only for the price movement attributable to
 * the last 7 days. A quantity bought inside the window is measured from
 * its own real purchase price, never pretended to have existed before
 * it did. Never derived from deposits/withdrawals/admin balance
 * adjustments (those are never SpotOrder fills, so they're invisible to
 * this module by construction — see app/api/account/weekly-pnl/route.ts,
 * which only ever queries SpotWallet/SpotOrder).
 *
 * Pure — no DB, no React, no fetch.
 */

import { computeSpotCostBasis, type SpotFillLike } from "./cost-basis";

export interface TimedSpotFill extends SpotFillLike {
  at: Date;
}

export interface WeeklyPnlResult {
  /** Price-driven P/L on the quantity still held right now, over the
   *  window — 0 whenever currentQuantity is 0, no matter what was sold
   *  before that. */
  pnl: number;
  /** Cost basis of the currently-held quantity, valued as of window
   *  start (or real purchase price for a quantity bought inside the
   *  window) — the percent denominator. NOT a portfolio-value figure. */
  baselineValue: number;
}

/**
 * `allFills` should cover the full real fill history for this currency
 * (not just the window), sorted oldest-first — same requirement
 * computeSpotCostBasis already documents. Only real SpotOrder fills ever
 * appear here, so an admin BalanceAdjustment or seeded balance (never a
 * fill) can't establish any quantity/cost basis — computeSpotCostBasis's
 * own existing surplus protection then prices such untracked-but-still-
 * held quantity at `currentPrice`, contributing exactly $0.
 *
 * currentQuantity <= 0 short-circuits immediately: there is nothing
 * currently held whose price performance could be measured, so no fill
 * replay or price lookup is needed at all.
 *
 * Reconstruction for currentQuantity > 0:
 *  1. Replay fills strictly before `windowStart` to find the quantity
 *     real trades explain as of window-start (clamped at 0 — Spot has
 *     no short position).
 *  2. Re-base that quantity's cost to the window-start MARKET price via
 *     a synthetic opening BUY fill, then blend in every real fill from
 *     inside the window through the same weighted-average engine used
 *     for the all-time figure — a quantity bought inside the window is
 *     therefore measured from its own real purchase price (its whole
 *     holding period IS the window), while a carried-through quantity is
 *     measured only from the window-start reference. A partial/full sale
 *     inside the window simply reduces `qty` the normal way; whatever's
 *     left is exactly `currentQuantity`, so nothing sold ever leaks a
 *     stale value back in as P/L.
 */
export function computeWeeklyPnl(
  allFills: TimedSpotFill[],
  currentQuantity: number,
  currentPrice: number,
  historicalPrice: number,
  windowStart: Date
): WeeklyPnlResult {
  if (currentQuantity <= 0) return { pnl: 0, baselineValue: 0 };

  const beforeWindow = allFills.filter((f) => f.at < windowStart);
  const inWindow = allFills.filter((f) => f.at >= windowStart);

  let qtyBeforeWindow = 0;
  for (const f of beforeWindow) {
    if (f.filledQuantity <= 0) continue;
    if (f.side === "BUY") {
      qtyBeforeWindow += f.filledQuantity;
    } else {
      qtyBeforeWindow -= Math.min(f.filledQuantity, qtyBeforeWindow);
    }
  }
  qtyBeforeWindow = Math.max(0, qtyBeforeWindow);

  const seeded: SpotFillLike[] = [
    { side: "BUY", price: historicalPrice, filledQuantity: qtyBeforeWindow },
    ...inWindow,
  ];

  const { unrealizedPnl, costBasis } = computeSpotCostBasis(
    seeded,
    currentQuantity,
    currentPrice
  );

  return { pnl: unrealizedPnl, baselineValue: costBasis };
}
