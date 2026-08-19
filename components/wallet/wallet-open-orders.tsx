"use client";

import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSpotOrders, useCancelSpotOrder } from "@/hooks/use-api";
import { PairCell } from "@/components/trading/pair-cell";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * The "Open Orders" tab's table body (rendered inside
 * WalletAssetsSection's tab card) — reuses Trading's own order data and
 * cancel mutation (useSpotOrders/useCancelSpotOrder from hooks/use-api.ts,
 * the same ones components/trading/spot-orders-panel.tsx uses) rather
 * than a second order engine. Only OPEN orders are shown here (Wallet has
 * no order-history view, unlike Trading's own panel).
 */
export function WalletOpenOrders() {
  const { t } = useLocale();
  const { data: orders, isLoading } = useSpotOrders();
  const cancelOrder = useCancelSpotOrder();

  const openOrders = orders?.filter((o) => o.status === "OPEN") ?? [];

  async function handleCancel(id: string) {
    try {
      await cancelOrder.mutateAsync(id);
      toast.success(t("wallet.orders.cancelSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("wallet.orders.cancelError"));
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-5 py-3 font-medium">{t("wallet.orders.headers.pair")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.type")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.side")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.price")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.quantity")}</th>
            <th className="px-3 py-3 font-medium">{t("wallet.table.status")}</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-muted">
                {t("wallet.orders.loading")}
              </td>
            </tr>
          )}
          {!isLoading && openOrders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-muted">
                {t("wallet.orders.empty")}
              </td>
            </tr>
          )}
          {openOrders.map((o) => (
            <tr
              key={o.id}
              className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
            >
              <td className="px-5 py-3 font-medium text-foreground">
                <PairCell symbol={o.symbol} />
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
                {formatPrice(parseFloat(o.price))}
              </td>
              <td className="font-tabular px-3 py-3 text-foreground">{o.quantity}</td>
              <td className="px-3 py-3">
                <Badge variant="pending">{t("wallet.orders.statusOpen")}</Badge>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => handleCancel(o.id)}
                  disabled={cancelOrder.isPending}
                  className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label={t("wallet.orders.cancelAria")}
                >
                  {cancelOrder.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
