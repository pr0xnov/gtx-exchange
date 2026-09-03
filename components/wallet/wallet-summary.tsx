"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Purely presentational — WalletOverview supplies these figures, each
 * with its own distinct source (see hooks/use-api.ts's
 * useWalletFinancials, the shared hook Trading's header also uses, so
 * the two pages can never disagree):
 *
 * - `availableBalance`: free (non-locked) USDT only — the same number
 *   /withdrawal's own "Available" uses.
 * - `lockedInOrders`: USDT reserved by this user's own OPEN LIMIT BUY
 *   orders (SpotWallet(USDT).locked). Moving money here from
 *   `availableBalance` (placing an order) or back (cancelling one) is
 *   never itself a gain or loss.
 * - `assetsValue`: current market value of crypto holdings only, USDT
 *   excluded.
 *
 * `weeklyPnl`/`weeklyPnlPercent` is the SAME trailing-7-day, price-driven
 * figure /account's own summary card shows — same useWeeklyAssetPnl()
 * hook, same backend (app/api/account/weekly-pnl/route.ts), so the two
 * pages can never disagree either. It has its own loading/error state
 * (a separate query from the other three figures) and, unlike /account,
 * only the value/percentage text is colored — this panel's own
 * background never tints red/green.
 *
 * The old aggregate "Нереалізований PnL" line (mark-to-market gain/loss
 * summed across all held assets) has been removed from here entirely —
 * per-asset Unrealized PnL still lives in the assets table below
 * (WalletAssetsSection), unchanged.
 */
export function WalletSummary({
  availableBalance,
  lockedInOrders,
  assetsValue,
  weeklyPnl,
  weeklyPnlPercent,
  weeklyPnlLoading,
  weeklyPnlError,
  isLoading,
}: {
  availableBalance: number;
  lockedInOrders: number;
  assetsValue: number;
  weeklyPnl: number;
  weeklyPnlPercent: number | null;
  weeklyPnlLoading: boolean;
  weeklyPnlError: boolean;
  isLoading: boolean;
}) {
  const { t } = useLocale();
  const weeklyPnlPositive = weeklyPnl >= 0;
  const weeklyPnlTone =
    weeklyPnl === 0
      ? "text-foreground"
      : weeklyPnlPositive
        ? "text-primary"
        : "text-danger";

  const cards = [
    {
      label: t("wallet.summary.availableBalance"),
      value: availableBalance,
      accent: "text-foreground",
    },
    {
      label: t("wallet.summary.lockedInOrders"),
      value: lockedInOrders,
      accent: "text-muted",
    },
    {
      label: t("wallet.summary.assetsValue"),
      value: assetsValue,
      accent: "text-blue-300",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 sm:gap-x-10 md:gap-x-12">
        {cards.map((card) => (
          <div key={card.label}>
            <div className="text-xs font-medium text-muted">{card.label}</div>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <div className={cn("mt-1 text-2xl font-bold", card.accent)}>
                <AnimatedCurrency value={card.value} />
              </div>
            )}
          </div>
        ))}

        <div>
          <div className="text-xs font-medium text-muted">
            {t("account.summary.weeklyProfitLoss")}
          </div>
          {weeklyPnlLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : weeklyPnlError ? (
            <div className="mt-1 text-2xl font-bold text-muted">—</div>
          ) : (
            <>
              <div className={cn("mt-1 text-2xl font-bold", weeklyPnlTone)}>
                <AnimatedCurrency value={weeklyPnl} showSign />
              </div>
              {weeklyPnlPercent !== null && (
                <div
                  className={cn("font-tabular mt-1 text-sm font-semibold", weeklyPnlTone)}
                >
                  {weeklyPnlPositive ? "+" : ""}
                  {weeklyPnlPercent.toFixed(2)}%
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button variant="primary" size="sm" asChild>
          <Link href="/deposit">
            <ArrowDownToLine className="h-4 w-4" />
            {t("wallet.summary.deposit")}
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/withdrawal">
            <ArrowUpFromLine className="h-4 w-4" />
            {t("wallet.summary.withdraw")}
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/history">
            <History className="h-4 w-4" />
            {t("wallet.summary.history")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
