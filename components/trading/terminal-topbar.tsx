"use client";

import Link from "next/link";
import { usePortfolio } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Trading-specific stats strip (balance/credit/equity/profit). Global
 * navigation (logo, section links, account) lives in the shared Navbar
 * from the surrounding (dashboard) layout — this no longer duplicates it.
 */
export function TerminalTopbar() {
  const { data } = usePortfolio();

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
            <div className="text-muted">Credit</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(data?.credit ?? 0)}
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
                (data?.unrealizedPnl ?? 0) >= 0 ? "text-primary" : "text-danger"
              }`}
            >
              {formatCurrency(data?.unrealizedPnl ?? 0)}
            </div>
          </div>
        </div>
      </div>
      <Button size="sm" asChild>
        <Link href="/deposit">Deposit</Link>
      </Button>
    </header>
  );
}
