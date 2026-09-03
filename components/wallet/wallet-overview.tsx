"use client";

import {
  useAccountSummary,
  useSparklines,
  useWalletFinancials,
  useWeeklyAssetPnl,
} from "@/hooks/use-api";
import { WalletSummary } from "@/components/wallet/wallet-summary";
import { WalletAssetsSection } from "@/components/wallet/wallet-assets-section";

/**
 * Wallet's top card shows Available balance / In orders / Assets value
 * (all from the shared useWalletFinancials() hook — same as Trading's
 * header and Account's own summary cards, so the pages can never
 * disagree) plus the SAME trailing-7-day weekly P/L /account shows, via
 * the same useWeeklyAssetPnl() hook/endpoint — its own query, so it can
 * load or fail independently of the other three figures without ever
 * showing a fake 0.
 *
 * The asset rows themselves (and their own per-asset Unrealized PnL,
 * unchanged) are still read directly from useAccountSummary() here —
 * React Query dedupes this against useWalletFinancials()'s own identical
 * call, so it's not a second network request or a second source of
 * truth.
 */
export function WalletOverview() {
  const { data, isLoading: summaryLoading } = useAccountSummary();
  const financials = useWalletFinancials();
  const {
    data: weeklyPnl,
    isLoading: weeklyPnlLoading,
    isError: weeklyPnlError,
  } = useWeeklyAssetPnl();
  const isLoading = summaryLoading || financials.isLoading;

  const spotAssets = data?.spotAssets ?? [];

  const symbols = spotAssets.map((a) => a.symbol);
  const sparklines = useSparklines(symbols);

  return (
    <>
      <WalletSummary
        availableBalance={financials.availableBalance}
        lockedInOrders={financials.lockedInOrders}
        assetsValue={financials.assetsValue}
        weeklyPnl={weeklyPnl?.pnl ?? 0}
        weeklyPnlPercent={weeklyPnl?.percent ?? null}
        weeklyPnlLoading={weeklyPnlLoading}
        weeklyPnlError={weeklyPnlError}
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
