/**
 * Pure trading-math functions used by the order/position API routes and by
 * the portfolio recalculation service. Kept dependency-free and pure so they
 * are trivially unit-testable.
 */

export type Side = "LONG" | "SHORT";

/** Margin required to open a leveraged position of `amount` units at `entryPrice`. */
export function calculateMargin(amount: number, entryPrice: number, leverage: number): number {
  const notional = amount * entryPrice;
  return notional / leverage;
}

/** Unrealized PnL in quote currency (USDT) for an open position. */
export function calculateUnrealizedPnl(
  side: Side,
  amount: number,
  entryPrice: number,
  currentPrice: number
): number {
  const diff = currentPrice - entryPrice;
  const directional = side === "LONG" ? diff : -diff;
  return directional * amount;
}

/** PnL as a percentage of margin invested — what the UI shows as "ROE". */
export function calculatePnlPercent(
  side: Side,
  entryPrice: number,
  currentPrice: number,
  leverage: number
): number {
  const diff = currentPrice - entryPrice;
  const directional = side === "LONG" ? diff : -diff;
  return (directional / entryPrice) * leverage * 100;
}

/**
 * Liquidation price: the price at which unrealized loss consumes the entire
 * margin (using a simplified isolated-margin model, no maintenance margin
 * buffer beyond a small safety factor).
 */
export function calculateLiquidationPrice(
  side: Side,
  entryPrice: number,
  leverage: number,
  maintenanceMarginRate = 0.005
): number {
  const factor = 1 / leverage - maintenanceMarginRate;
  if (side === "LONG") {
    return entryPrice * (1 - factor);
  }
  return entryPrice * (1 + factor);
}

export interface TpSlCheckResult {
  shouldClose: boolean;
  reason?: "TAKE_PROFIT" | "STOP_LOSS" | "LIQUIDATION";
}

/** Determines whether a position should be auto-closed given the current price. */
export function checkTpSlLiquidation(params: {
  side: Side;
  currentPrice: number;
  takeProfit?: number | null;
  stopLoss?: number | null;
  liquidationPrice?: number | null;
}): TpSlCheckResult {
  const { side, currentPrice, takeProfit, stopLoss, liquidationPrice } = params;

  if (liquidationPrice != null) {
    const liquidated =
      side === "LONG" ? currentPrice <= liquidationPrice : currentPrice >= liquidationPrice;
    if (liquidated) return { shouldClose: true, reason: "LIQUIDATION" };
  }

  if (takeProfit != null) {
    const hit = side === "LONG" ? currentPrice >= takeProfit : currentPrice <= takeProfit;
    if (hit) return { shouldClose: true, reason: "TAKE_PROFIT" };
  }

  if (stopLoss != null) {
    const hit = side === "LONG" ? currentPrice <= stopLoss : currentPrice >= stopLoss;
    if (hit) return { shouldClose: true, reason: "STOP_LOSS" };
  }

  return { shouldClose: false };
}

export interface PortfolioSummary {
  balance: number;
  credit: number;
  equity: number;
  unrealizedPnl: number;
  usedMargin: number;
  freeMargin: number;
}

export function calculatePortfolioSummary(
  balance: number,
  credit: number,
  openPositions: { margin: number; unrealizedPnl: number }[]
): PortfolioSummary {
  const usedMargin = openPositions.reduce((sum, p) => sum + p.margin, 0);
  const unrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const equity = balance + credit + unrealizedPnl;
  const freeMargin = equity - usedMargin;

  return { balance, credit, equity, unrealizedPnl, usedMargin, freeMargin };
}
