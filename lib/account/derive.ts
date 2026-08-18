/**
 * The single financial-summary layer for Account, Wallet, and Trading's
 * header — Balance/Equity/Profit are computed here exactly once and
 * consumed identically everywhere (via GET /api/account/summary and
 * useAccountSummary()), so the three pages can never quietly disagree.
 *
 * Pure — no DB, no React. app/api/account/summary/route.ts supplies
 * `cashBalance` (the Spot USDT wallet's balance — never the margin/
 * futures Wallet, which Spot orders can't touch) and `spotCurrencies`
 * (one entry per currency the user has ever held or traded, each
 * already carrying real cost-basis/PnL from
 * lib/spot/cost-basis.ts's computeSpotCostBasis).
 */

export interface SpotCurrencySummary {
  currency: string;
  /** Current quantity held — 0 if fully sold. */
  amount: number;
  /** The real current market price — kept explicit (not reconstructed
   *  as value/amount) so it's still correct at amount = 0, where a
   *  fully-sold position's `value` is 0 but the asset's own market
   *  price obviously isn't. Optional here since calculateAccountSummary/
   *  calculateUnrealizedPnlPercent below never read it — it exists on
   *  this shared type purely so the same objects can flow straight into
   *  the API response (SpotAssetSummaryDto in hooks/use-api.ts, where
   *  it's required) without a second, parallel type. */
  currentPrice?: number;
  /** amount × currentPrice. */
  value: number;
  costBasis: number;
  unrealizedPnl: number;
  /** Cumulative realized PnL from every real sell of this currency,
   *  counted even if none of it is held anymore. */
  realizedPnl: number;
}

export interface AccountSummary {
  balance: number;
  equity: number;
  profit: number;
}

/**
 * Balance = Spot cash only (the Spot USDT wallet's balance) — never
 * crypto value, never Credit (there is no such input here at all),
 * never the margin/futures Wallet, usedMargin, or freeMargin. This is
 * intentionally the exact same number Trading's Spot order panel calls
 * "Available" for a BUY — one source, so the two can't disagree.
 *
 * Equity = Balance + the current market value of every Spot holding.
 * Deliberately excludes Futures entirely, per spec — open leveraged
 * positions are not part of "what the user owns" for this figure.
 *
 * Profit = the sum of every currency's *realized* PnL — money actually
 * banked from real completed Spot trades (a sell above or below its
 * average cost), not `Equity - Balance` (which would just restate the
 * crypto value, not a trading result) and not unrealized/paper gains on
 * currently-held assets (that's Wallet's separate "Unrealized PnL"
 * figure — see calculateUnrealizedPnlPercent below).
 */
export function calculateAccountSummary(params: {
  cashBalance: number;
  spotCurrencies: SpotCurrencySummary[];
}): AccountSummary {
  const cryptoValue = params.spotCurrencies.reduce((sum, c) => sum + c.value, 0);
  const profit = params.spotCurrencies.reduce((sum, c) => sum + c.realizedPnl, 0);

  return {
    balance: params.cashBalance,
    equity: params.cashBalance + cryptoValue,
    profit,
  };
}

/**
 * Wallet's "Unrealized PnL" — the mark-to-market gain/loss on assets
 * still held right now, as a percentage of their combined cost basis
 * (the same "gain / cost × 100" ROI basis calculateUnrealizedPnl's
 * futures counterpart already used — see lib/trading/engine.ts's
 * calculatePnlPercent — just applied to Spot's own cost-basis figures
 * instead of margin). 0% when nothing is held or nothing has any real
 * cost basis yet.
 */
export function calculateUnrealizedPnlPercent(
  spotCurrencies: SpotCurrencySummary[]
): number {
  const totalCostBasis = spotCurrencies.reduce((sum, c) => sum + c.costBasis, 0);
  if (totalCostBasis <= 0) return 0;
  const totalUnrealizedPnl = spotCurrencies.reduce((sum, c) => sum + c.unrealizedPnl, 0);
  return (totalUnrealizedPnl / totalCostBasis) * 100;
}
