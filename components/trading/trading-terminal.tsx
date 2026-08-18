"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TerminalTopbar } from "@/components/trading/terminal-topbar";
import { AssetWatchlist, DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import { ChartHeader } from "@/components/trading/chart-header";
import { CandlestickChart, Timeframe } from "@/components/trading/candlestick-chart";
import { SpotOrderPanel } from "@/components/trading/spot-order-panel";
import { SpotOrdersPanel } from "@/components/trading/spot-orders-panel";
import { useLivePrices } from "@/hooks/use-live-prices";

/**
 * Spot-only, per spec — Futures (leverage/margin/liquidation, the
 * Spot/Futures toggle, OrderPanel, OpenPositionsPanel) has been removed
 * from this user-facing terminal entirely. Those components and their
 * backend (app/api/orders/**, lib/trading/engine.ts, the Position
 * model) are deliberately left untouched on disk for possible future
 * reinstatement — this file just no longer imports or renders them.
 */
export function TradingTerminal() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") ?? "BTCUSDT";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const { prices } = useLivePrices();

  const ticker = prices[symbol];
  const displayName = DISPLAY_NAMES[symbol] ?? symbol;

  return (
    // Nested under the shared Navbar (h-16) via the (dashboard) layout, so
    // it fills the remaining viewport height instead of the full screen.
    // The chart's own container resizes via lightweight-charts' autoSize
    // ResizeObserver — nothing here needs to touch the chart directly.
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AssetWatchlist prices={prices} selected={symbol} onSelect={setSymbol} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TerminalTopbar />
          <ChartHeader
            displayName={displayName}
            price={ticker?.price}
            changePercent={ticker?.changePercent24h}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
          <div className="min-h-0 flex-1">
            <CandlestickChart
              symbol={symbol}
              timeframe={timeframe}
              livePrice={ticker?.price}
            />
          </div>
          <SpotOrdersPanel />
        </div>

        <div className="flex h-full w-80 shrink-0 flex-col border-l border-border">
          <SpotOrderPanel
            symbol={symbol}
            displayName={displayName}
            livePrice={ticker?.price}
          />
        </div>
      </div>
    </div>
  );
}
