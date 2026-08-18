"use client";

import { useAccountSummary } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";

/**
 * Trading-specific stats strip — Balance/Equity/Profit, sourced from the
 * same useAccountSummary() call Account and Wallet use (GET
 * /api/account/summary), so this header can never show a different
 * number than the other two pages. Credit is gone; Global navigation
 * (logo, section links, account) lives in the shared Navbar from the
 * surrounding (dashboard) layout — this no longer duplicates it.
 */
export function TerminalTopbar() {
  const { data } = useAccountSummary();
  const profitPositive = (data?.profit ?? 0) >= 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-8">
        <div className="hidden items-center gap-6 text-xs sm:flex">
          <div>
            <div className="text-muted">Balance</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(data?.balance ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-muted">Equity</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(data?.equity ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-muted">Profit</div>
            <div
              className={`font-tabular font-semibold ${
                profitPositive ? "text-primary" : "text-danger"
              }`}
            >
              {profitPositive ? "+" : ""}
              {formatCurrency(data?.profit ?? 0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
