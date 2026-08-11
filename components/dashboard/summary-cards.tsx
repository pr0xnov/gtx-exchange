"use client";

import { cn } from "@/lib/utils";
import { usePortfolio } from "@/hooks/use-api";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";

const CARD_STYLES = [
  { label: "Balance", tone: "bg-surface", accent: "text-foreground" },
  { label: "Credit", tone: "bg-[#1E2A44]", accent: "text-blue-300" },
  { label: "Equity", tone: "bg-[#1E2A44]", accent: "text-blue-300" },
  { label: "Profit", tone: "bg-primary/10", accent: "text-primary" },
];

export function SummaryCards() {
  const { data, isLoading } = usePortfolio();

  const values = [data?.balance ?? 0, data?.credit ?? 0, data?.equity ?? 0, data?.unrealizedPnl ?? 0];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARD_STYLES.map((card, i) => (
        <div
          key={card.label}
          className={cn(
            "rounded-2xl border border-border p-5 transition-all",
            card.tone
          )}
        >
          <div className="text-xs font-medium text-muted">{card.label}</div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <div className={cn("mt-1 text-xl font-bold", card.accent)}>
              <AnimatedCurrency value={values[i] ?? 0} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
