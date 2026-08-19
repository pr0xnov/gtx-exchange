"use client";

import { useAccountSummary } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Trading-specific stats strip — Balance/Equity/Profit, sourced from the
 * same useAccountSummary() call Account and Wallet use (GET
 * /api/account/summary), so this header can never show a different
 * number than the other two pages. Credit is gone; Global navigation
 * (logo, section links, account) lives in the shared Navbar from the
 * surrounding (dashboard) layout — this no longer duplicates it.
 */
export function TerminalTopbar() {
  const { t } = useLocale();
  const { data } = useAccountSummary();
  const profitPositive = (data?.profit ?? 0) >= 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-8">
        <div className="hidden items-center gap-6 text-xs sm:flex">
          <div>
            <div className="text-muted">{t("trading.topbar.balance")}</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(data?.balance ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-muted">{t("trading.topbar.equity")}</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(data?.equity ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-muted">{t("trading.topbar.profit")}</div>
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
