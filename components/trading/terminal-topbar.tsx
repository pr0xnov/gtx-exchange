"use client";

import { useWalletFinancials } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Trading-specific stats strip — Available Balance / In Orders / Assets
 * Value / Profit-Loss, from the same useWalletFinancials() hook Wallet's
 * top card uses (hooks/use-api.ts), reusing Wallet's own
 * "wallet.summary.*" translation keys too — so this header can never
 * show a different number OR a different label than /wallet. Credit is
 * gone; Global navigation (logo, section links, account) lives in the
 * shared Navbar from the surrounding (dashboard) layout — this no
 * longer duplicates it.
 */
export function TerminalTopbar() {
  const { t } = useLocale();
  const { availableBalance, lockedInOrders, assetsValue, profitLoss } =
    useWalletFinancials();
  const profitPositive = profitLoss >= 0;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-8">
        <div className="hidden items-center gap-6 text-xs sm:flex">
          <div>
            <div className="text-muted">{t("wallet.summary.availableBalance")}</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(availableBalance)}
            </div>
          </div>
          <div>
            <div className="text-muted">{t("wallet.summary.lockedInOrders")}</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(lockedInOrders)}
            </div>
          </div>
          <div>
            <div className="text-muted">{t("wallet.summary.assetsValue")}</div>
            <div className="font-tabular font-semibold text-foreground">
              {formatCurrency(assetsValue)}
            </div>
          </div>
          <div>
            <div className="text-muted">{t("wallet.summary.profitLoss")}</div>
            <div
              className={`font-tabular font-semibold ${
                profitPositive ? "text-primary" : "text-danger"
              }`}
            >
              {profitPositive ? "+" : ""}
              {formatCurrency(profitLoss)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
