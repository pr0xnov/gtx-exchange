"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSpotOrders, useCancelSpotOrder, type SpotOrderDto } from "@/hooks/use-api";
import { PairCell } from "@/components/trading/pair-cell";
import { DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
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
  onRequestCancel,
}: {
  rows: SpotOrderDto[];
  isLoading: boolean;
  emptyMessage: string;
  cancelPending: boolean;
  onRequestCancel: (id: string, symbol: string) => void;
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
              {/* Only shown for a genuine, nonzero partial fill (0 <
                  filled < ordered) — zero filled is never worth echoing
                  (whether OPEN, still untouched, or CANCELLED before any
                  fill), and a fully FILLED order's filledQuantity always
                  equals its quantity, so both cases were pure noise;
                  Status already says Open/Filled/Исполнен for those.
                  Stays visible for a CANCELLED order that partially
                  filled first, or an OPEN order that's partially filled
                  so far — genuinely new information neither the quantity
                  nor the status column already conveys. */}
              {parseFloat(o.filledQuantity) > 0 &&
                parseFloat(o.filledQuantity) !== parseFloat(o.quantity) && (
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
                  onClick={() => onRequestCancel(o.id, o.symbol)}
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
  const [pendingCancel, setPendingCancel] = useState<{
    id: string;
    symbol: string;
  } | null>(null);
  const { data: orders, isLoading } = useSpotOrders();
  const cancelOrder = useCancelSpotOrder();

  const openOrders = orders?.filter((o) => o.status === "OPEN") ?? [];
  const historyOrders = orders?.filter((o) => o.status !== "OPEN") ?? [];

  async function handleConfirmCancel() {
    if (!pendingCancel) return;
    const { id } = pendingCancel;
    setPendingCancel(null);
    try {
      await cancelOrder.mutateAsync(id);
      toast.success(t("trading.orders.cancelSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("trading.orders.cancelError"));
    }
  }

  return (
    <div className="flex flex-col border-t border-border">
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

      {/* Natural height, normal document flow — deliberately no fixed
          height/overflow-y-auto scroll box here. As many rows as exist
          render in full; the PAGE scrolls once this (plus everything
          above it) exceeds one viewport, rather than a cramped internal
          mini-scrollbar. */}
      <div className={cn(tab !== "open" && "hidden")}>
        <OrdersTable
          rows={openOrders}
          isLoading={isLoading}
          emptyMessage={t("trading.orders.emptyOpen")}
          cancelPending={cancelOrder.isPending}
          onRequestCancel={(id, symbol) => setPendingCancel({ id, symbol })}
        />
      </div>
      <div className={cn(tab !== "history" && "hidden")}>
        <OrdersTable
          rows={historyOrders}
          isLoading={isLoading}
          emptyMessage={t("trading.orders.emptyHistory")}
          cancelPending={cancelOrder.isPending}
          onRequestCancel={(id, symbol) => setPendingCancel({ id, symbol })}
        />
      </div>

      {/* Confirmation modal — z-50, the same layer every other modal in
          this codebase uses (see components/shared/document-list.tsx),
          which is deliberately above MarketTicker's z-40 fixed strip so
          it's never covered by it. */}
      {pendingCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !cancelOrder.isPending && setPendingCancel(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-foreground">
              {t("trading.orders.cancelConfirmTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {t("trading.orders.cancelConfirmBodyPrefix")}{" "}
              <span className="font-medium text-foreground">
                {DISPLAY_NAMES[pendingCancel.symbol] ?? pendingCancel.symbol}
              </span>
              {t("trading.orders.cancelConfirmBodySuffix")}
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPendingCancel(null)}
                disabled={cancelOrder.isPending}
              >
                {t("trading.orders.cancelConfirmBack")}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmCancel}
                disabled={cancelOrder.isPending}
              >
                {cancelOrder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("trading.orders.cancelConfirmConfirm")
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
