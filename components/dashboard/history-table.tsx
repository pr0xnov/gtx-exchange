"use client";

import { useState } from "react";
import { useHistory } from "@/hooks/use-api";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/skeleton";

const FILTERS = [
{ id: "all", label: "All transactions" },
{ id: "deposits", label: "Deposits" },
{ id: "withdrawals", label: "Withdrawals" },
{ id: "bonuses", label: "Bonuses" },
];

const TYPE_LABEL: Record<string, string> = {
DEPOSIT: "Deposit",
WITHDRAWAL: "Withdrawal",
BONUS: "Bonus",
TRADE_SETTLEMENT: "Trade",
};

const TYPE_SIGN: Record<string, 1 | -1> = {
DEPOSIT: 1,
BONUS: 1,
WITHDRAWAL: -1,
TRADE_SETTLEMENT: 1,
};

const STATUS_VARIANT: Record<string, "success" | "pending" | "danger"> = {
COMPLETED: "success",
PENDING: "pending",
FAILED: "danger",
};

export function HistoryTable() {
const [filter, setFilter] = useState("all");
const { data, isLoading } = useHistory(filter);

return ( <div className="rounded-2xl border border-border bg-card"> <div className="flex flex-wrap gap-2 border-b border-border p-4">
{FILTERS.map((f) => (
<button
key={f.id}
onClick={() => setFilter(f.id)}
className={cn(
"rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
filter === f.id
? "bg-primary/10 text-primary"
: "text-muted hover:bg-white/5 hover:text-foreground"
)}
>
{f.label} </button>
))} </div>

```
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted">
          <th className="px-5 py-3 font-medium">ID</th>
          <th className="px-5 py-3 font-medium">Type</th>
          <th className="px-5 py-3 font-medium">Amount</th>
          <th className="px-5 py-3 font-medium">Status</th>
          <th className="px-5 py-3 font-medium">Date</th>
        </tr>
      </thead>

      <tbody>
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border/50">
              <td className="px-5 py-4" colSpan={5}>
                <Skeleton className="h-5 w-full" />
              </td>
            </tr>
          ))}

        {!isLoading && data?.length === 0 && (
          <tr>
            <td colSpan={5} className="px-5 py-10 text-center text-muted">
              No transactions found.
            </td>
          </tr>
        )}

        {data?.map((tx) => {
          const sign = TYPE_SIGN[tx.type] ?? 1;

          return (
            <tr
              key={tx.id}
              className="border-b border-border/50 transition-colors last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-5 py-4 font-tabular text-muted">
                {tx.id.slice(0, 8).toUpperCase()}
              </td>

              <td className="px-5 py-4 text-foreground">
                {TYPE_LABEL[tx.type] ?? tx.type}
              </td>

              <td
                className={cn(
                  "px-5 py-4 font-tabular font-semibold",
                  sign > 0 ? "text-primary" : "text-danger"
                )}
              >
                {sign > 0 ? "+" : "-"}
                ${Math.abs(parseFloat(tx.amount)).toFixed(2)}
              </td>

              <td className="px-5 py-4">
                <Badge variant={STATUS_VARIANT[tx.status] ?? "pending"}>
                  {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                </Badge>
              </td>

              <td className="px-5 py-4 text-muted">
                {formatDate(tx.createdAt)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

);
}
