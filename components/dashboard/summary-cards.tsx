"use client";

import { cn } from "@/lib/utils";
import { useWalletFinancials, useWeeklyAssetPnl } from "@/hooks/use-api";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Available Balance / In Orders / Assets Value are the same shared
 * useWalletFinancials() figures /wallet and /trading's header use —
 * unchanged by this component. The 4th card is Account-specific: a
 * trailing-7-day, price-driven Spot P/L (see
 * app/api/account/weekly-pnl/route.ts and lib/spot/weekly-pnl.ts) —
 * deliberately its own hook/endpoint, not useWalletFinancials().profitLoss
 * (that figure is all-time and still exactly what /wallet and /trading
 * show under the same "Прибыль / Убыток" label — this page's own label
 * says "за 7 дней" specifically because its number means something
 * different now).
 */
export function SummaryCards() {
  const { availableBalance, lockedInOrders, assetsValue, isLoading } =
    useWalletFinancials();
  const { data: weeklyPnl, isLoading: weeklyPnlLoading } = useWeeklyAssetPnl();
  const { t } = useLocale();

  const pnl = weeklyPnl?.pnl ?? 0;
  const pnlPositive = pnl >= 0;

  const cards = [
    {
      label: t("wallet.summary.availableBalance"),
      value: availableBalance,
      tone: "bg-surface",
      accent: "text-foreground",
      loading: isLoading,
    },
    {
      label: t("wallet.summary.lockedInOrders"),
      value: lockedInOrders,
      tone: "bg-surface",
      accent: "text-muted",
      loading: isLoading,
    },
    {
      label: t("wallet.summary.assetsValue"),
      value: assetsValue,
      tone: "bg-[#1E2A44]",
      accent: "text-blue-300",
      loading: isLoading,
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
          {card.loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <div className={cn("mt-1 text-xl font-bold", card.accent)}>
              <AnimatedCurrency value={card.value} />
            </div>
          )}
        </div>
      ))}

      <div
        className={cn(
          "rounded-2xl border p-5 transition-all",
          pnl === 0
            ? "border-border bg-surface"
            : pnlPositive
              ? "border-primary/30 bg-primary/10"
              : "border-danger/30 bg-danger/10"
        )}
      >
        <div className="text-xs font-medium text-muted">
          {t("account.summary.weeklyProfitLoss")}
        </div>
        {weeklyPnlLoading ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <>
            <div
              className={cn(
                "mt-1 text-xl font-bold",
                pnl === 0
                  ? "text-foreground"
                  : pnlPositive
                    ? "text-primary"
                    : "text-danger"
              )}
            >
              <AnimatedCurrency value={pnl} showSign />
            </div>
            {weeklyPnl?.percent !== null && weeklyPnl?.percent !== undefined && (
              <div
                className={cn(
                  "font-tabular mt-1.5 text-sm font-semibold",
                  pnl === 0 ? "text-muted" : pnlPositive ? "text-primary" : "text-danger"
                )}
              >
                {pnlPositive ? "+" : ""}
                {weeklyPnl.percent.toFixed(2)}%
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
