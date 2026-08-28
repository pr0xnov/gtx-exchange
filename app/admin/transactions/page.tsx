"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/use-admin-api";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Skeleton } from "@/components/shared/skeleton";
import { formatAmount, formatDate } from "@/lib/utils";

interface TransactionRow {
  id: string;
  type: string;
  asset: string;
  amount: string;
  direction: string | null;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminList("transactions", page);
  const result = data as
    | { transactions: TransactionRow[]; page: number; totalPages: number; total: number }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <p className="mt-1 text-sm text-muted">
          {result?.total ?? 0} total — every ledger entry, all types
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Type</th>
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
            {!isLoading && result?.transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No transactions yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              result?.transactions.map((t) => {
                const negative = t.type === "WITHDRAWAL" || t.direction === "DEBIT";
                return (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3.5 text-foreground">
                      {t.user.firstName} {t.user.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {t.type.replace(/_/g, " ")}
                    </td>
                    <td
                      className={`font-tabular px-4 py-3.5 text-right ${negative ? "text-danger" : "text-primary"}`}
                    >
                      {negative ? "-" : "+"}
                      {formatAmount(t.amount)} {t.asset}
                    </td>
                    <td className="px-4 py-3.5 text-muted">{t.status}</td>
                    <td className="px-4 py-3.5 text-muted">{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })}
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
