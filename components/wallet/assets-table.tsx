"use client";

import { CoinIcon } from "@/components/markets/coin-icon";
import { usePositions } from "@/hooks/use-api";
import { buildWalletAssetRows } from "@/lib/wallet/derive";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";

/**
 * "My Assets" — this app's open margin positions (/api/positions via
 * usePositions(), already polled every 2s), reshaped by
 * buildWalletAssetRows into display rows. Names/icons come from
 * MARKET_REGISTRY + CoinIcon (the same registry and icon component
 * Markets and Trading's watchlist already use) — no separate coin list,
 * no invented icons.
 */
export function WalletAssetsTable() {
  const { data: positions, isLoading } = usePositions();
  const rows = buildWalletAssetRows(positions ?? []);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">My Assets</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Asset</th>
              <th className="px-3 py-3 font-medium">Amount</th>
              <th className="px-3 py-3 font-medium">Price / Cost basis</th>
              <th className="px-5 py-3 text-right font-medium">Unrealized PnL</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                  Loading assets…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                  You don&apos;t have any assets yet. Open a trade to get started.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.symbol}
                className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <CoinIcon symbol={row.baseAsset} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {row.baseAsset}
                      </div>
                      <div className="truncate text-xs text-muted">{row.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-tabular text-foreground">{row.amount}</div>
                  <div className="font-tabular text-xs text-muted">
                    {formatCurrency(row.value)}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="font-tabular text-foreground">
                    {formatPrice(row.currentPrice)}
                  </div>
                  <div className="font-tabular text-xs text-muted">
                    {formatPrice(row.costBasis)}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div
                    className={cn(
                      "font-tabular font-semibold",
                      row.pnl >= 0 ? "text-primary" : "text-danger"
                    )}
                  >
                    {row.pnl >= 0 ? "+" : ""}
                    {formatCurrency(row.pnl)}
                  </div>
                  <div
                    className={cn(
                      "font-tabular text-xs",
                      row.pnl >= 0 ? "text-primary" : "text-danger"
                    )}
                  >
                    {row.pnl >= 0 ? "+" : ""}
                    {row.pnlPercent.toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
