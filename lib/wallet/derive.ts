/**
 * Pure data-shaping helpers for the /wallet page. No React, no fetching —
 * this only reshapes data that already comes from /api/positions (via
 * usePositions()) into the row view Wallet's assets table renders, the
 * same "combine what already exists" approach lib/markets/derive.ts uses
 * for the Markets dashboard.
 *
 * Wallet's "assets" ARE this app's open margin positions — there is no
 * separate spot coin-holding balance with a cost basis anywhere in the
 * schema, so a position's entryPrice is used directly as its cost basis
 * and its amount/currentPrice/pnl/pnlPercent are trusted as-is from
 * calculateUnrealizedPnl/calculatePnlPercent (lib/trading/engine.ts) via
 * the existing /api/positions route — nothing here recomputes PnL.
 */
import { MARKET_REGISTRY } from "@/lib/binance/client";

const REGISTRY_BY_SYMBOL = new Map(MARKET_REGISTRY.map((e) => [e.symbol, e]));

export interface WalletPositionLike {
  symbol: string;
  displaySymbol: string;
  side: "LONG" | "SHORT";
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface WalletAssetRow {
  symbol: string;
  baseAsset: string;
  name: string;
  displaySymbol: string;
  side: "LONG" | "SHORT";
  amount: number;
  /** Current notional value of the position (amount × currentPrice) —
   *  simple derived arithmetic for display, not a second PnL calc. */
  value: number;
  currentPrice: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
}

export function buildWalletAssetRows(positions: WalletPositionLike[]): WalletAssetRow[] {
  return positions.map((p) => {
    const entry = REGISTRY_BY_SYMBOL.get(p.symbol);
    return {
      symbol: p.symbol,
      baseAsset: entry?.baseAsset ?? p.symbol.replace(/USDT$/, ""),
      name: entry?.name ?? p.displaySymbol,
      displaySymbol: p.displaySymbol,
      side: p.side,
      amount: p.amount,
      value: p.amount * p.currentPrice,
      currentPrice: p.currentPrice,
      costBasis: p.entryPrice,
      pnl: p.pnl,
      pnlPercent: p.pnlPercent,
    };
  });
}

/**
 * Aggregate PnL% across every open position, on the exact same basis a
 * single position already uses (calculatePnlPercent in
 * lib/trading/engine.ts is algebraically pnl / margin * 100 — see that
 * file) — this just sums both sides of that ratio across all positions
 * instead of inventing a new percentage basis for the wallet total.
 */
export function calculateTotalPnlPercent(
  unrealizedPnl: number,
  usedMargin: number
): number {
  if (usedMargin <= 0) return 0;
  return (unrealizedPnl / usedMargin) * 100;
}

/**
 * Total Wallet Value = available balance + current value of open
 * positions, per spec. `/api/orders` debits `wallet.balance` by a
 * position's margin the moment it opens (confirmed against the running
 * app: balance dropped by exactly the margin amount on open, at zero
 * PnL) — so `balance` alone already excludes money that's still the
 * user's, just locked as margin. calculatePortfolioSummary's `equity`
 * field (balance + credit + unrealizedPnl) inherits that gap. A
 * position's current total worth — what the user would get back by
 * closing it right now — is its margin plus its unrealized PnL, so that
 * has to be added back in: balance + credit + usedMargin + unrealizedPnl.
 * With no open positions usedMargin/unrealizedPnl are both 0 and this
 * reduces to exactly balance + credit, matching spec section 16. Every
 * input here is a field /api/portfolio (calculatePortfolioSummary)
 * already computes — this only re-sums them, it doesn't add a second
 * independent PnL/position calculation.
 */
export function calculateTotalWalletValue(summary: {
  balance: number;
  credit: number;
  usedMargin: number;
  unrealizedPnl: number;
}): number {
  return summary.balance + summary.credit + summary.usedMargin + summary.unrealizedPnl;
}
