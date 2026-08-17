"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, History } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnimatedCurrency } from "@/components/dashboard/animated-currency";
import { Skeleton } from "@/components/shared/skeleton";
import { WalletChart } from "@/components/wallet/wallet-chart";
import { usePortfolio } from "@/hooks/use-api";
import { calculateTotalPnlPercent, calculateTotalWalletValue } from "@/lib/wallet/derive";

/**
 * Total Wallet Value = available balance + current value of open
 * positions (see calculateTotalWalletValue in lib/wallet/derive.ts for
 * why that isn't simply /api/portfolio's `equity` field in this app —
 * balance is already debited by margin when a position opens, so margin
 * has to be added back to reflect what the position is really worth).
 * Every number involved — balance, credit, usedMargin, unrealizedPnl —
 * comes straight from the existing /api/portfolio endpoint
 * (usePortfolio()), which itself already runs calculatePortfolioSummary()
 * from lib/trading/engine.ts. With no open positions this reduces to
 * exactly balance + credit, and PnL is 0 — no separate empty-state
 * branch needed.
 */
export function WalletSummary() {
  const { data, isLoading } = usePortfolio();

  const totalValue = data ? calculateTotalWalletValue(data) : 0;
  const pnl = data?.unrealizedPnl ?? 0;
  const pnlPercent = data
    ? calculateTotalPnlPercent(data.unrealizedPnl, data.usedMargin)
    : 0;
  const positive = pnl >= 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-xs font-medium text-muted">Est. Total Value</div>
          {isLoading ? (
            <Skeleton className="mt-2 h-9 w-40" />
          ) : (
            <div className="mt-1 text-3xl font-bold text-foreground">
              <AnimatedCurrency value={totalValue} />
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-muted">
            <span>Unrealized PnL</span>
            {!isLoading && (
              <span
                className={cn(
                  "font-tabular font-semibold",
                  positive ? "text-primary" : "text-danger"
                )}
              >
                {positive ? "+" : ""}
                {formatCurrency(pnl)} ({positive ? "+" : ""}
                {pnlPercent.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        <div className="w-full sm:w-56">
          <WalletChart value={totalValue} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast("Transfers between wallets aren't available yet")}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Transfer
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
