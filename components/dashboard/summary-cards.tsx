"use client";

import { cn } from "@/lib/utils";
import { useAccountSummary } from "@/hooks/use-api";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Exactly three cards: Balance, Equity, Profit — sourced from the one
 * shared useAccountSummary() hook (GET /api/account/summary), the same
 * data Wallet and Trading's header read. No client-side price merging
 * or Credit/Futures involvement happens here at all; the server already
 * computed everything from a single snapshot.
 */
export function SummaryCards() {
  const { data, isLoading } = useAccountSummary();
  const { t } = useLocale();
  const profitPositive = (data?.profit ?? 0) >= 0;

  const cards = [
    {
      label: t("account.balance"),
      value: data?.balance ?? 0,
      tone: "bg-surface",
      accent: "text-foreground",
    },
    {
      label: t("account.equity"),
      value: data?.equity ?? 0,
      tone: "bg-[#1E2A44]",
      accent: "text-blue-300",
    },
    {
      label: t("account.profit"),
      value: data?.profit ?? 0,
      tone: "bg-primary/10",
      accent: profitPositive ? "text-primary" : "text-danger",
      showSign: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn("rounded-2xl border border-border p-5 transition-all", card.tone)}
        >
          <div className="text-xs font-medium text-muted">{card.label}</div>
          {isLoading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <div className={cn("mt-1 text-xl font-bold", card.accent)}>
              <AnimatedCurrency value={card.value} showSign={card.showSign} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
