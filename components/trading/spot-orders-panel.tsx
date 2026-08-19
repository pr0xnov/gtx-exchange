"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSpotOrders, useCancelSpotOrder, type SpotOrderDto } from "@/hooks/use-api";
import { PairCell } from "@/components/trading/pair-cell";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * One tab's table (thead + rows) — rendered twice by SpotOrdersPanel
 * below (once for Open orders, once for Order history), each inside its
 * own always-mounted scroll box. Kept as a separate component (rather
 * than one table with a `rows = tab === "open" ? ... : ...` swap) so
 * each tab gets a genuinely independent DOM node: switching tabs never
 * remounts or replaces the other tab's scroll container, so neither
 * tab's scroll position is ever reset or clamped by the other's row
 * count.
 */
function OrdersTable({
  rows,
  isLoading,
  emptyMessage,
  cancelPending,
  onCancel,
}: {
  rows: SpotOrderDto[];
  isLoading: boolean;
  emptyMessage: string;
  cancelPending: boolean;
  onCancel: (id: string) => void;
}) {
  const { t } = useLocale();
  return (
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-background">
        <tr className="border-b border-border text-left text-muted">
          <th className="px-4 py-2 font-medium">{t("trading.orders.columnPair")}</th>
          <th className="px-2 py-2 font-medium">{t("trading.orders.columnType")}</th>
          <th className="px-2 py-2 font-medium">{t("trading.orders.columnSide")}</th>
          <th className="px-2 py-2 font-medium">{t("trading.orders.columnPrice")}</th>
          <th className="px-2 py-2 font-medium">{t("trading.orders.columnQuantity")}</th>
          <th className="px-2 py-2 font-medium">{t("trading.orders.columnStatus")}</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody>
        {isLoading && (
          <tr>
            <td colSpan={7} className="px-4 py-6 text-center text-muted">
              {t("trading.orders.loading")}
            </td>
          </tr>
        )}
        {!isLoading && rows.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-6 text-center text-muted">
              {emptyMessage}
            </td>
          </tr>
        )}
        {rows.map((o) => (
          <tr
            key={o.id}
            className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
          >
            <td className="px-4 py-2.5 font-medium text-foreground">
              <PairCell symbol={o.symbol} />
            </td>
            <td className="px-2 py-2.5 text-muted">
              {o.type === "MARKET"
                ? t("trading.orderPanel.market")
                : t("trading.orderPanel.limit")}
            </td>
            <td className="px-2 py-2.5">
              <Badge variant={o.side === "BUY" ? "success" : "danger"}>
                {o.side === "BUY"
                  ? t("trading.orderPanel.buy")
                  : t("trading.orderPanel.sell")}
              </Badge>
            </td>
            <td className="font-tabular px-2 py-2.5 text-foreground">
              {formatPrice(parseFloat(o.price))}
            </td>
            <td className="font-tabular px-2 py-2.5 text-foreground">
              {o.quantity}
              {o.status !== "OPEN" && (
                <span className="text-muted">
                  {" "}
                  ({o.filledQuantity} {t("trading.orders.filledSuffix")})
                </span>
              )}
            </td>
            <td className="px-2 py-2.5">
              <Badge
                variant={
                  o.status === "FILLED"
                    ? "success"
                    : o.status === "CANCELLED"
                      ? "muted"
                      : "pending"
                }
              >
                {o.status === "OPEN"
                  ? t("trading.orders.statusOpen")
                  : o.status === "FILLED"
                    ? t("trading.orders.statusFilled")
                    : t("trading.orders.statusCancelled")}
              </Badge>
            </td>
            <td className="px-4 py-2.5 text-right">
              {o.status === "OPEN" && (
                <button
                  onClick={() => onCancel(o.id)}
                  disabled={cancelPending}
                  className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                  aria-label={t("trading.orders.cancelAria")}
                >
                  {cancelPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SpotOrdersPanel() {
  const { t } = useLocale();
  const [tab, setTab] = useState<"open" | "history">("open");
  const { data: orders, isLoading } = useSpotOrders();
  const cancelOrder = useCancelSpotOrder();

  const openOrders = orders?.filter((o) => o.status === "OPEN") ?? [];
  const historyOrders = orders?.filter((o) => o.status !== "OPEN") ?? [];

  async function handleCancel(id: string) {
    try {
      await cancelOrder.mutateAsync(id);
      toast.success(t("trading.orders.cancelSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("trading.orders.cancelError"));
    }
  }

  return (
    <div className="flex h-52 flex-col border-t border-border">
      <div className="flex items-center gap-6 border-b border-border px-4">
        <button
          onClick={() => setTab("open")}
          className={cn(
            "border-b-2 py-3 text-xs font-medium transition-colors",
            tab === "open"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t("trading.orders.openTab")}{" "}
          {openOrders.length > 0 && `(${openOrders.length})`}
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "border-b-2 py-3 text-xs font-medium transition-colors",
            tab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t("trading.orders.historyTab")}
        </button>
      </div>

      {/* Fixed-height (h-52 above) scroll box, independent of the chart —
          min-h-0 is required so this flex child can actually shrink to
          that fixed box instead of growing to fit every row (the classic
          flex/overflow trap); overscroll-contain stops wheel scroll from
          chaining into the chart/page once the list hits its top/bottom. */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          tab !== "open" && "hidden"
        )}
      >
        <OrdersTable
          rows={openOrders}
          isLoading={isLoading}
          emptyMessage={t("trading.orders.emptyOpen")}
          cancelPending={cancelOrder.isPending}
          onCancel={handleCancel}
        />
      </div>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          tab !== "history" && "hidden"
        )}
      >
        <OrdersTable
          rows={historyOrders}
          isLoading={isLoading}
          emptyMessage={t("trading.orders.emptyHistory")}
          cancelPending={cancelOrder.isPending}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
