"use client";

import { cn } from "@/lib/utils";
import { useWalletFinancials } from "@/hooks/use-api";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Exactly four cards — Available Balance / In Orders / Assets Value /
 * Profit-Loss — sourced from the one shared useWalletFinancials() hook
 * (hooks/use-api.ts), the same hook /wallet and /trading's header
 * already use. Reuses their exact "wallet.summary.*" translation keys
 * too, not a separate "account.*" set, so labels can never drift apart
 * across the three pages either. No client-side price merging or
 * Credit/Futures involvement happens here at all — the server already
 * computed everything from a single snapshot.
 */
export function SummaryCards() {
  const { availableBalance, lockedInOrders, assetsValue, profitLoss, isLoading } =
    useWalletFinancials();
  const { t } = useLocale();
  const profitPositive = profitLoss >= 0;

  const cards = [
    {
      label: t("wallet.summary.availableBalance"),
      value: availableBalance,
      tone: "bg-surface",
      accent: "text-foreground",
    },
    {
      label: t("wallet.summary.lockedInOrders"),
      value: lockedInOrders,
      tone: "bg-surface",
      accent: "text-muted",
    },
    {
      label: t("wallet.summary.assetsValue"),
      value: assetsValue,
      tone: "bg-[#1E2A44]",
      accent: "text-blue-300",
    },
    {
      label: t("wallet.summary.profitLoss"),
      value: profitLoss,
      tone: "bg-primary/10",
      accent: profitPositive ? "text-primary" : "text-danger",
      showSign: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
