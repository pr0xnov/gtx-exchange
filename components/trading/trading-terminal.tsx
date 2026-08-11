"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { TerminalTopbar } from "@/components/trading/terminal-topbar";
import { AssetWatchlist, DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import { ChartHeader } from "@/components/trading/chart-header";
import { CandlestickChart, Timeframe } from "@/components/trading/candlestick-chart";
import { OrderPanel } from "@/components/trading/order-panel";
import { OpenPositionsPanel } from "@/components/trading/open-positions-panel";
import { useLivePrices } from "@/hooks/use-live-prices";

export function TradingTerminal() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") ?? "BTCUSDT";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const { prices } = useLivePrices();

  const ticker = prices[symbol];
  const displayName = DISPLAY_NAMES[symbol] ?? symbol;

  return (
    <div className="flex h-screen flex-col bg-background">
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
            <CandlestickChart symbol={symbol} timeframe={timeframe} livePrice={ticker?.price} />
          </div>
          <OpenPositionsPanel />
        </div>

        <OrderPanel symbol={symbol} displayName={displayName} livePrice={ticker?.price} />
      </div>
    </div>
  );
}
