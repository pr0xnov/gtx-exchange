"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/use-admin-api";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";

interface OrderRow {
  id: string;
  symbol: string;
  side: string;
  type: string;
  price: string;
  quantity: string;
  filledQuantity: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

const STATUS_VARIANT: Record<string, "success" | "danger" | "pending"> = {
  FILLED: "success",
  CANCELLED: "danger",
  OPEN: "pending",
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminList("orders", page);
  const result = data as
    | { orders: OrderRow[]; page: number; totalPages: number; total: number }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted">{result?.total ?? 0} total</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && result?.orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No orders yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              result?.orders.map((o) => (
                <tr key={o.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {o.user.firstName} {o.user.lastName}
                  </td>
                  <td className="px-4 py-3.5 text-foreground">{o.symbol}</td>
                  <td className="px-4 py-3.5">
                    <span className={o.side === "BUY" ? "text-primary" : "text-danger"}>
                      {o.side}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{o.type}</td>
                  <td className="font-tabular px-4 py-3.5 text-right text-foreground">
                    {formatPrice(Number(o.price), 4)}
                  </td>
                  <td className="font-tabular px-4 py-3.5 text-right text-foreground">
                    {formatPrice(Number(o.quantity), 8)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={STATUS_VARIANT[o.status] ?? "default"}>
                      {o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {result && (
        <PaginationFooter
          page={result.page}
          totalPages={result.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}
