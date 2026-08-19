"use client";

import { useState } from "react";
import { useHistory } from "@/hooks/use-api";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";
import { DictionaryKey } from "@/lib/i18n/dictionaries";

const FILTERS = [
  { id: "all", labelKey: "history.filterAll" as DictionaryKey },
  { id: "deposits", labelKey: "history.filterDeposits" as DictionaryKey },
  { id: "withdrawals", labelKey: "history.filterWithdrawals" as DictionaryKey },
  { id: "bonuses", labelKey: "history.filterBonuses" as DictionaryKey },
];

const TYPE_LABEL_KEY: Record<string, DictionaryKey> = {
  DEPOSIT: "history.typeDeposit",
  WITHDRAWAL: "history.typeWithdrawal",
  BONUS: "history.typeBonus",
  TRADE_SETTLEMENT: "history.typeTrade",
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

const STATUS_LABEL_KEY: Record<string, DictionaryKey> = {
  COMPLETED: "history.statusCompleted",
  PENDING: "history.statusPending",
  FAILED: "history.statusFailed",
};

export function HistoryTable() {
  const { t } = useLocale();
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useHistory(filter);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap gap-2 border-b border-border p-4">
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
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">{t("history.columnId")}</th>
              <th className="px-5 py-3 font-medium">{t("history.columnType")}</th>
              <th className="px-5 py-3 font-medium">{t("history.columnAmount")}</th>
              <th className="px-5 py-3 font-medium">{t("history.columnStatus")}</th>
              <th className="px-5 py-3 font-medium">{t("history.columnDate")}</th>
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
                  {t("history.emptyState")}
                </td>
              </tr>
            )}

            {data?.map((tx) => {
              const sign = TYPE_SIGN[tx.type] ?? 1;
              const typeKey = TYPE_LABEL_KEY[tx.type];
              const statusKey = STATUS_LABEL_KEY[tx.status];

              return (
                <tr
                  key={tx.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="font-tabular px-5 py-4 text-muted">
                    {tx.id.slice(0, 8).toUpperCase()}
                  </td>

                  <td className="px-5 py-4 text-foreground">
                    {typeKey ? t(typeKey) : tx.type}
                  </td>

                  <td
                    className={cn(
                      "font-tabular px-5 py-4 font-semibold",
                      sign > 0 ? "text-primary" : "text-danger"
                    )}
                  >
                    {sign > 0 ? "+" : "-"}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[tx.status] ?? "pending"}>
                      {statusKey
                        ? t(statusKey)
                        : tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>

                  <td className="px-5 py-4 text-muted">{formatDate(tx.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
