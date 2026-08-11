"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  usePositions,
  useClosePosition,
  usePendingOrders,
  useCancelOrder,
} from "@/hooks/use-api";
import { toast } from "sonner";

export function OpenPositionsPanel() {
  const [tab, setTab] = useState<"positions" | "pending">("positions");
  const { data: positions, isLoading } = usePositions();
  const closePosition = useClosePosition();
  const { data: pendingOrders, isLoading: pendingLoading } = usePendingOrders();
  const cancelOrder = useCancelOrder();

  async function handleClose(id: string) {
    try {
      await closePosition.mutateAsync(id);
      toast.success("Position closed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close position");
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelOrder.mutateAsync(id);
      toast.success("Order cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    }
  }

  return (
    <div className="flex h-52 flex-col border-t border-border">
      <div className="flex items-center gap-6 border-b border-border px-4">
        <button
          onClick={() => setTab("positions")}
          className={cn(
            "border-b-2 py-3 text-xs font-medium transition-colors",
            tab === "positions"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Open trades{" "}
          {positions && positions.length > 0 && `(${positions.length})`}
        </button>
        <button
          onClick={() => setTab("pending")}
          className={cn(
            "border-b-2 py-3 text-xs font-medium transition-colors",
            tab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Pending orders{" "}
          {pendingOrders && pendingOrders.length > 0 && `(${pendingOrders.length})`}
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "positions" && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Open price</th>
                <th className="px-2 py-2 font-medium">Current price</th>
                <th className="px-2 py-2 font-medium">Take Profit</th>
                <th className="px-2 py-2 font-medium">Stop Loss</th>
                <th className="px-2 py-2 font-medium">Profit</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-muted">
                    Loading positions…
                  </td>
                </tr>
              )}
              {!isLoading && positions?.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-muted">
                    No open positions. Place a trade to get started.
                  </td>
                </tr>
              )}
              {positions?.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {p.displaySymbol}
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge variant={p.side === "LONG" ? "success" : "danger"}>
                      {p.side === "LONG" ? "Buy" : "Sell"}
                    </Badge>
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-foreground">
                    {p.amount} <span className="text-muted">×{p.leverage}</span>
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-foreground">
                    {formatPrice(p.entryPrice)}
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-foreground">
                    {formatPrice(p.currentPrice)}
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-muted">
                    {p.takeProfit ? formatPrice(p.takeProfit) : "—"}
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-muted">
                    {p.stopLoss ? formatPrice(p.stopLoss) : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2.5 font-tabular font-semibold",
                      p.pnl >= 0 ? "text-primary" : "text-danger"
                    )}
                  >
                    {p.pnl >= 0 ? "+" : ""}
                    {p.pnl.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleClose(p.id)}
                      disabled={closePosition.isPending}
                      className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Close position"
                    >
                      {closePosition.isPending ? (
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
        )}

        {tab === "pending" && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Limit price</th>
                <th className="px-2 py-2 font-medium">Leverage</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {pendingLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    Loading orders…
                  </td>
                </tr>
              )}
              {!pendingLoading && pendingOrders?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted">
                    No pending limit orders.
                  </td>
                </tr>
              )}
              {pendingOrders?.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {o.asset.displaySymbol}
                  </td>
                  <td className="px-2 py-2.5">
                    <Badge variant={o.side === "BUY" ? "success" : "danger"}>
                      {o.side === "BUY" ? "Buy" : "Sell"}
                    </Badge>
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-foreground">{o.amount}</td>
                  <td className="px-2 py-2.5 font-tabular text-foreground">
                    {o.limitPrice ? formatPrice(parseFloat(o.limitPrice)) : "—"}
                  </td>
                  <td className="px-2 py-2.5 font-tabular text-muted">×{o.leverage}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleCancel(o.id)}
                      disabled={cancelOrder.isPending}
                      className="rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Cancel order"
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
        )}
      </div>
    </div>
  );
}
