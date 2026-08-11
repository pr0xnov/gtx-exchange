"use client";

import Link from "next/link";
import { useHistory } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton";
import { cn } from "@/lib/utils";

const TYPE_SIGN: Record<string, 1 | -1> = {
  DEPOSIT: 1,
  BONUS: 1,
  WITHDRAWAL: -1,
  TRADE_SETTLEMENT: 1,
};

const TYPE_LABEL: Record<string, string> = {
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  BONUS: "Bonus",
  TRADE_SETTLEMENT: "Trade",
};

export function RecentTransactions() {
  const { data, isLoading } = useHistory("all");
  const recent = data?.slice(0, 6);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent transactions</h3>
        <Link href="/history" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {!isLoading && recent?.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">No transactions yet.</p>
      )}

      <div className="space-y-1">
        {recent?.map((tx) => {
          const sign = TYPE_SIGN[tx.type] ?? 1;
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.02]"
            >
              <div>
                <div className="text-sm font-medium text-foreground">
                  {TYPE_LABEL[tx.type]}
                </div>
                <div className="text-xs text-muted">{formatDate(tx.createdAt)}</div>
              </div>
              <div
                className={cn(
                  "font-tabular text-sm font-semibold",
                  sign > 0 ? "text-primary" : "text-danger"
                )}
              >
                {sign > 0 ? "+" : "-"}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
