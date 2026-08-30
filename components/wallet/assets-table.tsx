"use client";

import { useRouter } from "next/navigation";
import { CoinIcon } from "@/components/markets/coin-icon";
import { MiniSparkline } from "@/components/markets/mini-sparkline";
import { Skeleton } from "@/components/shared/skeleton";
import { MARKET_REGISTRY } from "@/lib/binance/client";
import type { SpotAssetSummaryDto } from "@/hooks/use-api";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const NAME_BY_BASE = new Map(MARKET_REGISTRY.map((e) => [e.baseAsset, e.name]));

/**
 * The "My Assets" tab's table body (rendered inside WalletAssetsSection's
 * tab card) — Spot holdings only (Futures/margin positions are no
 * longer part of the user-facing Trading experience, per spec). Rows
 * come straight from useAccountSummary()'s `spotAssets` — real
 * quantities from SpotWallet, real cost-basis/unrealizedPnl from
 * lib/spot/cost-basis.ts, computed server-side from actual filled
 * SpotOrder history. Names/icons come from MARKET_REGISTRY + CoinIcon,
 * the same registry Markets and Trading already use.
 *
 * Each row navigates to Trading's own existing symbol param
 * (?symbol=BTCUSDT — TradingTerminal's initialSymbol already reads this
 * exact format) rather than a second symbol scheme.
 *
 * `sparklines` is real recent-close data per symbol (WalletOverview
 * fetches it via the existing useSparklines() hook — the same one
 * Markets already uses for its own sparkline column, backed by
 * /api/markets/klines). That kline fetch is one extra round trip after
 * the assets themselves have already loaded (isLoading below is only
 * about useAccountSummary()), so a row whose sparkline hasn't arrived
 * yet — the normal case for roughly the first second after every fresh
 * page load/refresh — shows a pulsing Skeleton instead of sitting
 * empty or blank; MiniSparkline's own built-in fallback path (a fixed
 * fake demo curve when given fewer than 2 real points) must never
 * render here regardless.
 */
export function WalletAssetsTable({
  rows,
  sparklines,
  isLoading,
}: {
  rows: SpotAssetSummaryDto[];
  sparklines: Record<string, number[]>;
  isLoading: boolean;
}) {
  const router = useRouter();
  const { t } = useLocale();

  function goToTrading(symbol: string) {
    router.push(`/trading?symbol=${symbol}`);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-5 py-3 font-medium">{t("wallet.assets.headers.asset")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.assets.headers.amount")}</th>
            <th className="px-3 py-3 font-medium">
              {t("wallet.assets.headers.priceCostBasis")}
            </th>
            <th className="px-3 py-3 font-medium">{t("wallet.assets.headers.chart")}</th>
            <th className="px-5 py-3 text-right font-medium">
              {t("wallet.assets.headers.unrealizedPnl")}
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                {t("wallet.assets.loading")}
              </td>
            </tr>
          )}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                {t("wallet.assets.empty")}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            // row.currentPrice is the real market price straight from
            // the server — never reconstructed as value/amount, which
            // would wrongly show $0.00 once a position is fully sold
            // (amount = 0) even though the asset's own price isn't 0.
            const costPerUnit = row.amount > 0 ? row.costBasis / row.amount : 0;
            const decimals = row.currentPrice > 0 && row.currentPrice < 10 ? 4 : 2;
            const series = sparklines[row.symbol];

            return (
              <tr
                key={row.currency}
                onClick={() => goToTrading(row.symbol)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    goToTrading(row.symbol);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`${row.currency}: ${t("wallet.assets.openOnTradingAria")}`}
                className="cursor-pointer border-b border-border/50 outline-none transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:ring-1 focus-visible:ring-primary/50"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <CoinIcon symbol={row.currency} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {row.currency}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {NAME_BY_BASE.get(row.currency) ?? row.currency}
                      </div>
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
                    {formatPrice(row.currentPrice, decimals)} USDT
                  </div>
                  <div className="font-tabular text-xs text-muted">
                    {t("wallet.assets.costLabel")} {formatPrice(costPerUnit, decimals)}{" "}
                    USDT
                  </div>
                </td>
                <td className="px-3 py-3" data-testid="chart-cell">
                  {series && series.length >= 2 ? (
                    <MiniSparkline prices={series} className="h-8 w-28" />
                  ) : (
                    <Skeleton className="h-8 w-28" />
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div
                    className={cn(
                      "font-tabular font-semibold",
                      row.unrealizedPnl >= 0 ? "text-primary" : "text-danger"
                    )}
                  >
                    {row.unrealizedPnl >= 0 ? "+" : ""}
                    {formatCurrency(row.unrealizedPnl)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
