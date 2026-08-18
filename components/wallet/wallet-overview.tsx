"use client";

import { useAccountSummary, useSparklines } from "@/hooks/use-api";
import { calculateUnrealizedPnlPercent } from "@/lib/account/derive";
import { WalletSummary } from "@/components/wallet/wallet-summary";
import { WalletAssetsTable } from "@/components/wallet/assets-table";

/**
 * Wallet reads the exact same useAccountSummary() data Account and
 * Trading's header use (GET /api/account/summary) — Balance/Equity/
 * Profit here are literally the same numbers Account's cards show, not
 * a second independently-derived figure. The only thing computed
 * locally is the *unrealized* PnL aggregate (sum across currently-held
 * Spot assets) — a different, legitimate figure from Account's
 * *realized* Profit, both already provided by the endpoint.
 */
export function WalletOverview() {
  const { data, isLoading } = useAccountSummary();

  const spotAssets = data?.spotAssets ?? [];
  const unrealizedPnl = spotAssets.reduce((sum, a) => sum + a.unrealizedPnl, 0);
  const unrealizedPnlPercent = calculateUnrealizedPnlPercent(spotAssets);

  const symbols = spotAssets.map((a) => a.symbol);
  const sparklines = useSparklines(symbols);

  return (
    <>
      <WalletSummary
        balance={data?.balance ?? 0}
        equity={data?.equity ?? 0}
        profit={data?.profit ?? 0}
        unrealizedPnl={unrealizedPnl}
        unrealizedPnlPercent={unrealizedPnlPercent}
        isLoading={isLoading}
      />
      <WalletAssetsTable
        rows={spotAssets}
        sparklines={sparklines}
        isLoading={isLoading}
      />
    </>
  );
}
