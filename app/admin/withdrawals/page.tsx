"use client";

import { useState } from "react";
import { useAdminList } from "@/hooks/use-admin-api";
import { Skeleton } from "@/components/shared/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";
import { USDT_NETWORKS, isUsdtNetwork } from "@/lib/deposit/usdt-networks";

interface WithdrawalRow {
  id: string;
  amount: string;
  asset: string;
  method: string | null;
  network: string | null;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

function networkLabel(network: string | null): string {
  if (!network || !isUsdtNetwork(network)) return "—";
  return `${network} — ${USDT_NETWORKS[network].description}`;
}

export default function AdminWithdrawalsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminList("withdrawals", page);
  const result = data as
    | { withdrawals: WithdrawalRow[]; page: number; totalPages: number; total: number }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Withdrawals</h1>
        <p className="mt-1 text-sm text-muted">{result?.total ?? 0} total</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Network</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
            {!isLoading && result?.withdrawals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No withdrawals yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              result?.withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {w.user.firstName} {w.user.lastName}
                    <div className="text-xs text-muted">{w.user.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{w.method ?? "—"}</td>
                  <td className="px-4 py-3.5 text-muted">{networkLabel(w.network)}</td>
                  <td className="font-tabular px-4 py-3.5 text-right text-danger">
                    -{formatPrice(Number(w.amount))} {w.asset}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{w.status}</td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(w.createdAt)}</td>
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
