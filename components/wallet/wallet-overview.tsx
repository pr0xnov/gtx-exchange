"use client";

import { useAccountSummary, useSparklines, useWalletFinancials } from "@/hooks/use-api";
import { calculateUnrealizedPnlPercent } from "@/lib/account/derive";
import { WalletSummary } from "@/components/wallet/wallet-summary";
import { WalletAssetsSection } from "@/components/wallet/wallet-assets-section";

/**
 * Wallet's top card shows four figures, all from useWalletFinancials()
 * (hooks/use-api.ts) — the same hook Trading's header and Account's own
 * summary cards use, so the three pages can never disagree. Deliberately
 * NOT account-summary's raw "balance"/"equity" pair (lib/account/
 * derive.ts's calculateAccountSummary) — that pair is no longer rendered
 * as a labelled card anywhere, but the API still returns it unchanged:
 *
 * - Available balance / In orders / Assets value / Profit-Loss — see
 *   useWalletFinancials()'s own doc comment for each figure's exact
 *   source.
 *
 * `unrealizedPnl`/`unrealizedPnlPercent` and the asset rows themselves
 * are Wallet-specific (not shared with Trading's header), so they're
 * still read directly from useAccountSummary() here — React Query
 * dedupes this against useWalletFinancials()'s own identical call, so
 * it's not a second network request or a second source of truth.
 */
export function WalletOverview() {
  const { data, isLoading: summaryLoading } = useAccountSummary();
  const financials = useWalletFinancials();
  const isLoading = summaryLoading || financials.isLoading;

  const spotAssets = data?.spotAssets ?? [];
  const unrealizedPnl = spotAssets.reduce((sum, a) => sum + a.unrealizedPnl, 0);
  const unrealizedPnlPercent = calculateUnrealizedPnlPercent(spotAssets);

  const symbols = spotAssets.map((a) => a.symbol);
  const sparklines = useSparklines(symbols);

  return (
    <>
      <WalletSummary
        availableBalance={financials.availableBalance}
        lockedInOrders={financials.lockedInOrders}
        assetsValue={financials.assetsValue}
        profitLoss={financials.profitLoss}
        unrealizedPnl={unrealizedPnl}
        unrealizedPnlPercent={unrealizedPnlPercent}
        isLoading={isLoading}
      />
      <WalletAssetsSection
        rows={spotAssets}
        sparklines={sparklines}
        isLoading={isLoading}
      />
    </>
  );
}
