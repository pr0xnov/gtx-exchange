"use client";

import { useMemo } from "react";
import { useMarkets } from "@/hooks/use-api";
import { useLivePrices } from "@/hooks/use-live-prices";
import {
  getGainers,
  getLosers,
  getTopVolume,
  mergeMarketData,
} from "@/lib/markets/derive";
import { MarketOverviewSection } from "./market-overview-section";
import { MarketDynamics } from "./market-dynamics";
import { HighestActivity } from "./highest-activity";
import { MarketTable } from "./market-table";

/**
 * The one client island on /analytics. A single useMarkets() (REST
 * snapshot, already polled every 3s elsewhere in the app) + useLivePrices()
 * (the existing WS relay — same hook Trading/Markets already use, no new
 * connection type introduced) pair, merged once via the existing
 * mergeMarketData(), then sliced every way each section below needs — no
 * section fetches or polls its own data, no new API, no new WebSocket.
 */
export function AnalyticsDashboard({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { data, isLoading } = useMarkets();
  const { prices } = useLivePrices();

  const rows = useMemo(() => mergeMarketData(data ?? [], prices), [data, prices]);

  const gainers = useMemo(() => getGainers(rows), [rows]);
  const losers = useMemo(() => getLosers(rows), [rows]);
  const topVolume = useMemo(() => getTopVolume(rows, 4), [rows]);

  return (
    <>
      <MarketOverviewSection
        gainers={gainers}
        losers={losers}
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
      />
      <MarketDynamics rows={rows} isLoading={isLoading} />
      <HighestActivity
        rows={topVolume}
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
      />
      <MarketTable rows={rows} isLoading={isLoading} isAuthenticated={isAuthenticated} />
    </>
  );
}
