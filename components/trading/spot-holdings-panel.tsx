"use client";

import { useState } from "react";
import { cn, formatCurrency, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSpotHoldings, useSpotOrders } from "@/hooks/use-api";

export function SpotHoldingsPanel() {
  const [tab, setTab] = useState<"holdings" | "orders">("holdings");
  const { data: holdings, isLoading } = useSpotHoldings();
  const { data: orders, isLoading: ordersLoading } = useSpotOrders();

  return (
    <div className="flex h-52 flex-col border-t border-border">
      <div className="flex items-center gap-6 border-b border-border px-4">
        <button
          onClick={() => setTab("holdings")}
          className={cn(
            "border-b-2 py-3 text-xs font-medium transition-colors",
            tab === "holdings"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Holdings {holdings && holdings.length > 0 && `(${holdings.length})`}
        </button>
        <button
          onClick={() => setTab("orders")}
          className={cn(
            "border-b-2 py-3 text-xs font-medium transition-colors",
            tab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          Recent orders
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "holdings" && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-2 py-2 font-medium">Quantity</th>
                <th className="px-2 py-2 font-medium">Price</th>
                <th className="px-2 py-2 font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    Loading holdings…
                  </td>
                </tr>
              )}
              {!isLoading && holdings?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No holdings yet. Buy an asset to get started.
                  </td>
                </tr>
              )}
              {holdings?.map((h) => (
                <tr
                  key={h.symbol}
                  className="border-b border-border/50 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {h.displaySymbol}
                  </td>
                  <td className="font-tabular px-2 py-2.5 text-foreground">
                    {h.quantity}
                  </td>
                  <td className="font-tabular px-2 py-2.5 text-foreground">
                    {formatPrice(h.price)}
                  </td>
                  <td className="font-tabular px-2 py-2.5 text-foreground">
                    {formatCurrency(h.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "orders" && (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border text-left text-muted">
                <th className="px-4 py-2 font-medium">Asset</th>
                <th className="px-2 py-2 font-medium">Side</th>
                <th className="px-2 py-2 font-medium">Quantity</th>
                <th className="px-2 py-2 font-medium">Price</th>
                <th className="px-2 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    Loading orders…
                  </td>
                </tr>
              )}
              {!ordersLoading && orders?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">
                    No spot orders yet.
                  </td>
                </tr>
              )}
              {orders?.map((o) => (
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
                  <td className="font-tabular px-2 py-2.5 text-foreground">
                    {o.quantity}
                  </td>
                  <td className="font-tabular px-2 py-2.5 text-foreground">
                    {formatPrice(parseFloat(o.price))}
                  </td>
                  <td className="font-tabular px-2 py-2.5 text-foreground">
                    {formatCurrency(parseFloat(o.total))}
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
