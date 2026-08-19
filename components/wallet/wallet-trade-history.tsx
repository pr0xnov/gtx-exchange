"use client";

import { CoinIcon } from "@/components/markets/coin-icon";
import { Badge } from "@/components/ui/badge";
import { DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import { MARKET_REGISTRY } from "@/lib/binance/client";
import { useSpotOrders } from "@/hooks/use-api";
import { formatCurrency, formatDate, formatPrice } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const REGISTRY_BY_SYMBOL = new Map(MARKET_REGISTRY.map((e) => [e.symbol, e]));

/**
 * The "History" tab's table body (rendered inside WalletAssetsSection's
 * tab card) — completed spot trades only. Reuses the exact same data
 * source as Trading's own Order history tab (useSpotOrders from
 * hooks/use-api.ts, backed by SpotOrder — see spot-orders-panel.tsx),
 * filtered down to status === "FILLED" only: an OPEN order isn't a trade
 * yet, and a CANCELLED order never became one, so neither belongs in a
 * record of what was actually bought/sold. There's no separate Trade/Fill
 * table in the schema — SpotOrder already carries `filledQuantity` and
 * the exact execution `price` (spot fills are all-or-nothing, never
 * partial — see server/ws/fill-spot-order.ts — but Total is computed
 * from these "executed" fields rather than the original `quantity`
 * regardless, so this stays correct if that ever changes). The API
 * already returns orders newest-first (`orderBy: { createdAt: "desc" }`
 * in app/api/spot/orders/route.ts), so no client-side re-sort is needed.
 *
 * No max-height/internal scroll here on purpose — same as My Assets
 * (assets-table.tsx) and Open Orders (wallet-open-orders.tsx) right next
 * to it, this table just grows with its row count and the page itself
 * scrolls. overflow-x-auto is only a horizontal fallback for narrow
 * desktop widths, not a vertical scroll box.
 */
export function WalletTradeHistory() {
  const { t } = useLocale();
  const { data: orders, isLoading } = useSpotOrders();
  const trades = orders?.filter((o) => o.status === "FILLED") ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-5 py-3 font-medium">
              {t("wallet.history.headers.cryptoPair")}
            </th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.type")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.side")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.price")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.quantity")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.history.headers.total")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.status")}</th>
            <th className="px-5 py-3 font-medium">
              {t("wallet.history.headers.dateTime")}
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-center text-muted">
                {t("wallet.history.loading")}
              </td>
            </tr>
          )}
          {!isLoading && trades.length === 0 && (
            <tr>
              <td colSpan={8} className="px-5 py-8 text-center text-muted">
                {t("wallet.history.empty")}
              </td>
            </tr>
          )}
          {trades.map((o) => {
            const entry = REGISTRY_BY_SYMBOL.get(o.symbol);
            const filledQty = parseFloat(o.filledQuantity);
            const price = parseFloat(o.price);
            return (
              <tr
                key={o.id}
                className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <CoinIcon symbol={o.symbol} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">
                        {DISPLAY_NAMES[o.symbol] ?? o.symbol}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {entry?.name ?? o.symbol}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">
                  {o.type === "MARKET"
                    ? t("wallet.table.typeMarket")
                    : t("wallet.table.typeLimit")}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={o.side === "BUY" ? "success" : "danger"}>
                    {o.side === "BUY"
                      ? t("wallet.table.sideBuy")
                      : t("wallet.table.sideSell")}
                  </Badge>
                </td>
                <td className="font-tabular px-3 py-3 text-foreground">
                  {formatPrice(price)}
                </td>
                <td className="font-tabular px-3 py-3 text-foreground">
                  {filledQty} {entry?.baseAsset ?? ""}
                </td>
                <td className="font-tabular px-3 py-3 text-foreground">
                  {formatCurrency(filledQty * price)}
                </td>
                <td className="px-3 py-3">
                  <Badge variant="success">{t("wallet.history.statusFilled")}</Badge>
                </td>
                <td className="px-5 py-3 text-muted">{formatDate(o.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
