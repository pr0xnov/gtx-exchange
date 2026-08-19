"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { WalletAssetsTable } from "@/components/wallet/assets-table";
import { WalletOpenOrders } from "@/components/wallet/wallet-open-orders";
import { WalletTradeHistory } from "@/components/wallet/wallet-trade-history";
import type { SpotAssetSummaryDto } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * "My Assets" / "Open Orders" / "History" tab card. Open Orders and
 * History both reuse Trading's own order data (see wallet-open-orders.tsx
 * and wallet-trade-history.tsx) — switching tabs is pure client-side
 * state, no navigation/reload. Tab styling mirrors Trading's own tabs
 * (components/trading/spot-orders-panel.tsx): a bottom border that turns
 * primary/green on the active tab.
 */
export function WalletAssetsSection({
  rows,
  sparklines,
  isLoading,
}: {
  rows: SpotAssetSummaryDto[];
  sparklines: Record<string, number[]>;
  isLoading: boolean;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"assets" | "orders" | "history">("assets");

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-6 border-b border-border px-5">
        <button
          onClick={() => setTab("assets")}
          className={cn(
            "border-b-2 py-4 text-sm font-medium transition-colors",
            tab === "assets"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t("wallet.tabs.myAssets")}
        </button>
        <button
          onClick={() => setTab("orders")}
          className={cn(
            "border-b-2 py-4 text-sm font-medium transition-colors",
            tab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t("wallet.tabs.openOrders")}
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "border-b-2 py-4 text-sm font-medium transition-colors",
            tab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted hover:text-foreground"
          )}
        >
          {t("wallet.tabs.history")}
        </button>
      </div>
      {tab === "assets" && (
        <WalletAssetsTable rows={rows} sparklines={sparklines} isLoading={isLoading} />
      )}
      {tab === "orders" && <WalletOpenOrders />}
      {tab === "history" && <WalletTradeHistory />}
    </div>
  );
}
