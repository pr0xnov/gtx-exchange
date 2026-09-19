"use client";

import { useWalletFinancials } from "@/hooks/use-api";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Trading-specific stats strip — Available Balance / In Orders / Assets
 * Value, from the same useWalletFinancials() hook Wallet's top card uses
 * (hooks/use-api.ts), reusing Wallet's own "wallet.summary.*" translation
 * keys too — so this header can never show a different number OR a
 * different label than /wallet. Credit is gone; Global navigation (logo,
 * section links, account) lives in the shared Navbar from the
 * surrounding (dashboard) layout — this no longer duplicates it.
 *
 * No Profit/Loss field here (deliberately removed, not replaced with the
 * weekly figure either) — Trading isn't a P/L summary surface. The 3
 * remaining metrics use justify-between over a capped width so they
 * spread naturally into the space that freed up, without stretching
 * edge-to-edge on a wide screen.
 */
export function TerminalTopbar() {
  const { t } = useLocale();
  const { availableBalance, lockedInOrders, assetsValue } = useWalletFinancials();

  return (
    <header className="hidden h-14 items-center justify-between border-b border-border px-4 sm:flex">
      <div className="flex items-center gap-8">
        <div className="flex max-w-xl flex-1 items-center justify-between gap-8 text-xs">
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
        </div>
      </div>
    </header>
  );
}
