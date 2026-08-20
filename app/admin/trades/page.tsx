"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/use-admin-api";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Skeleton } from "@/components/shared/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";

interface TradeRow {
  id: string;
  symbol: string;
  side: string;
  price: string;
  filledQuantity: string;
  updatedAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminTradesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminList("trades", page);
  const result = data as
    | { trades: TradeRow[]; page: number; totalPages: number; total: number }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trades</h1>
        <p className="mt-1 text-sm text-muted">{result?.total ?? 0} total</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Filled Qty</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && result?.trades.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No trades yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              result?.trades.map((t) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {t.user.firstName} {t.user.lastName}
                  </td>
                  <td className="px-4 py-3.5 text-foreground">{t.symbol}</td>
                  <td className="px-4 py-3.5">
                    <span className={t.side === "BUY" ? "text-primary" : "text-danger"}>
                      {t.side}
                    </span>
                  </td>
                  <td className="font-tabular px-4 py-3.5 text-right text-foreground">
                    {formatPrice(Number(t.price), 4)}
                  </td>
                  <td className="font-tabular px-4 py-3.5 text-right text-foreground">
                    {formatPrice(Number(t.filledQuantity), 8)}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(t.updatedAt)}</td>
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
