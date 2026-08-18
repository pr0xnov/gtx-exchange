"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { WalletChart } from "@/components/wallet/wallet-chart";

/**
 * Purely presentational — WalletOverview supplies `balance`/`equity`/
 * `profit` straight from useAccountSummary(), the exact same numbers
 * Account's Balance/Equity/Profit cards show (same endpoint, same
 * formulas — see lib/account/derive.ts) — there is no second "Est.
 * Total Value" figure computed here anymore.
 *
 * `unrealizedPnl`/`unrealizedPnlPercent` are a distinct, Wallet-specific
 * figure: the mark-to-market gain/loss on assets still held right now
 * (aggregated from the same call's per-asset cost-basis data). This is
 * deliberately NOT the same as `profit` (realized PnL from completed
 * sells) — showing both, clearly labeled, is the point.
 */
export function WalletSummary({
  balance,
  equity,
  profit,
  unrealizedPnl,
  unrealizedPnlPercent,
  isLoading,
}: {
  balance: number;
  equity: number;
  profit: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  isLoading: boolean;
}) {
  const profitPositive = profit >= 0;
  const unrealizedPositive = unrealizedPnl >= 0;

  const cards = [
    { label: "Balance", value: balance, accent: "text-foreground" },
    { label: "Equity", value: equity, accent: "text-blue-300" },
    {
      label: "Profit",
      value: profit,
      accent: profitPositive ? "text-primary" : "text-danger",
      showSign: true,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="grid grid-cols-3 gap-x-8 gap-y-6 sm:gap-x-12 md:gap-x-16">
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
        <div className="w-full sm:w-56">
          <WalletChart value={equity} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>Unrealized PnL</span>
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
            Deposit
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/withdrawal">
            <ArrowUpFromLine className="h-4 w-4" />
            Withdraw
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/history">
            <History className="h-4 w-4" />
            History
          </Link>
        </Button>
      </div>
    </div>
  );
}
