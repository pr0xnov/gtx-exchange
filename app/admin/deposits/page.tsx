"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/use-admin-api";
import { Skeleton } from "@/components/shared/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";

interface DepositRow {
  id: string;
  amount: string;
  asset: string;
  method: string | null;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminDepositsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminList("deposits", page);
  const result = data as
    | { deposits: DepositRow[]; page: number; totalPages: number; total: number }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
        <p className="mt-1 text-sm text-muted">{result?.total ?? 0} total</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && result?.deposits.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No deposits yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              result?.deposits.map((d) => (
                <tr key={d.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {d.user.firstName} {d.user.lastName}
                    <div className="text-xs text-muted">{d.user.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{d.method ?? "—"}</td>
                  <td className="font-tabular px-4 py-3.5 text-right text-primary">
                    +{formatPrice(Number(d.amount))} {d.asset}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{d.status}</td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {result.page} of {result.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
              disabled={page >= result.totalPages}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
