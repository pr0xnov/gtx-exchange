import { CoinIcon } from "@/components/markets/coin-icon";
import { DISPLAY_NAMES } from "@/components/trading/asset-watchlist";

/**
 * Single "Pair" cell content (coin icon + display name, e.g. "BTC/USD")
 * shared by every Open Orders table — Trading's own SpotOrdersPanel and
 * Wallet's WalletOpenOrders both render the exact same order rows
 * (useSpotOrders), so this keeps the icon lookup and name formatting in
 * one place instead of two copies drifting apart. Reuses CoinIcon, the
 * same coin-icon component Markets/Trading watchlist and Wallet's My
 * Assets table already render — no second icon system.
 */
export function PairCell({ symbol }: { symbol: string }) {
  return (
    <div className="flex items-center gap-2">
      <CoinIcon symbol={symbol} />
      <span>{DISPLAY_NAMES[symbol] ?? symbol}</span>
    </div>
  );
}
