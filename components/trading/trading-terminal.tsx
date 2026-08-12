"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TerminalTopbar } from "@/components/trading/terminal-topbar";
import { AssetWatchlist, DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import { ChartHeader } from "@/components/trading/chart-header";
import { CandlestickChart, Timeframe } from "@/components/trading/candlestick-chart";
import { OrderPanel } from "@/components/trading/order-panel";
import { SpotOrderPanel } from "@/components/trading/spot-order-panel";
import { OpenPositionsPanel } from "@/components/trading/open-positions-panel";
import { SpotOrdersPanel } from "@/components/trading/spot-orders-panel";
import { TradeModeToggle, TradeMode } from "@/components/trading/trade-mode-toggle";
import { useLivePrices } from "@/hooks/use-live-prices";

export function TradingTerminal() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") ?? "BTCUSDT";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [mode, setMode] = useState<TradeMode>("FUTURES");
  const { prices } = useLivePrices();

  const ticker = prices[symbol];
  const displayName = DISPLAY_NAMES[symbol] ?? symbol;

  return (
    // Nested under the shared Navbar (h-16) via the (dashboard) layout, so
    // it fills the remaining viewport height instead of the full screen.
    // The chart's own container resizes via lightweight-charts' autoSize
    // ResizeObserver — nothing here needs to touch the chart directly.
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <TerminalTopbar />
      <div className="flex flex-1 overflow-hidden">
        <AssetWatchlist prices={prices} selected={symbol} onSelect={setSymbol} />

        <div className="flex flex-1 flex-col overflow-hidden">
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
          {mode === "FUTURES" ? <OpenPositionsPanel /> : <SpotOrdersPanel />}
        </div>

        <div className="flex h-full w-80 shrink-0 flex-col border-l border-border">
          <TradeModeToggle mode={mode} onChange={setMode} />
          {mode === "FUTURES" ? (
            <OrderPanel
              symbol={symbol}
              displayName={displayName}
              livePrice={ticker?.price}
            />
          ) : (
            <SpotOrderPanel
              symbol={symbol}
              displayName={displayName}
              livePrice={ticker?.price}
            />
          )}
        </div>
      </div>
    </div>
  );
}
