"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Purely presentational — WalletOverview supplies these four figures,
 * each with its own distinct source (see hooks/use-api.ts's
 * useWalletFinancials, the shared hook Trading's header also uses, so
 * the two pages can never disagree):
 *
 * - `availableBalance`: free (non-locked) USDT only — the same number
 *   /withdrawal's own "Available" uses.
 * - `lockedInOrders`: USDT reserved by this user's own OPEN LIMIT BUY
 *   orders (SpotWallet(USDT).locked). Moving money here from
 *   `availableBalance` (placing an order) or back (cancelling one) is
 *   never itself a gain or loss — it doesn't touch `profitLoss`.
 * - `assetsValue`: current market value of crypto holdings only, USDT
 *   excluded.
 * - `profitLoss`: realized PnL from completed sells (unchanged from the
 *   previous "Profit" card, just relabeled).
 *
 * `unrealizedPnl`/`unrealizedPnlPercent` are a distinct, Wallet-specific
 * figure: the mark-to-market gain/loss on assets still held right now
 * (aggregated from the same call's per-asset cost-basis data). This is
 * deliberately NOT the same as `profitLoss` (realized PnL from completed
 * sells) — showing both, clearly labeled, is the point.
 */
export function WalletSummary({
  availableBalance,
  lockedInOrders,
  assetsValue,
  profitLoss,
  unrealizedPnl,
  unrealizedPnlPercent,
  isLoading,
}: {
  availableBalance: number;
  lockedInOrders: number;
  assetsValue: number;
  profitLoss: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  isLoading: boolean;
}) {
  const { t } = useLocale();
  const profitPositive = profitLoss >= 0;
  const unrealizedPositive = unrealizedPnl >= 0;

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
    {
      label: t("wallet.summary.profitLoss"),
      value: profitLoss,
      accent: profitPositive ? "text-primary" : "text-danger",
      showSign: true,
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
                <AnimatedCurrency value={card.value} showSign={card.showSign} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>{t("wallet.summary.unrealizedPnl")}</span>
        {!isLoading && (
          <span
            className={cn(
              "font-tabular font-semibold",
              unrealizedPositive ? "text-primary" : "text-danger"
            )}
          >
            {unrealizedPositive ? "+" : ""}
            {formatCurrency(unrealizedPnl)} ({unrealizedPositive ? "+" : ""}
            {unrealizedPnlPercent.toFixed(2)}%)
          </span>
        )}
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
