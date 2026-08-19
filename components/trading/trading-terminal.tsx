"use client";

import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { TerminalTopbar } from "@/components/trading/terminal-topbar";
import { AssetWatchlist, DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import { ChartHeader } from "@/components/trading/chart-header";
import {
  CandlestickChart,
  Timeframe,
  TIMEFRAMES,
} from "@/components/trading/candlestick-chart";
import { SpotOrderPanel } from "@/components/trading/spot-order-panel";
import { SpotOrdersPanel } from "@/components/trading/spot-orders-panel";
import { useLivePrices } from "@/hooks/use-live-prices";
import { useLocale } from "@/lib/i18n/locale-context";

const TIMEFRAME_STORAGE_KEY = "gtx-trading-timeframe";

function isValidTimeframe(value: string | null): value is Timeframe {
  return value != null && TIMEFRAMES.some((tf) => tf.value === value);
}

/**
 * Spot-only, per spec — Futures (leverage/margin/liquidation, the
 * Spot/Futures toggle, OrderPanel, OpenPositionsPanel) has been removed
 * from this user-facing terminal entirely. Those components and their
 * backend (app/api/orders/**, lib/trading/engine.ts, the Position
 * model) are deliberately left untouched on disk for possible future
 * reinstatement — this file just no longer imports or renders them.
 */
export function TradingTerminal() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") ?? "BTCUSDT";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframeState] = useState<Timeframe>("1h");
  // CandlestickChart doesn't mount at all until this flips to true — see
  // the layout effect below. A plain useState("1h") plus reading
  // localStorage in an effect isn't enough on its own: CandlestickChart
  // would still mount on the very first commit with timeframe="1h" and
  // its OWN effect would immediately fire a real "1h" klines fetch, which
  // resolves and paints onto the canvas moments later — a real visible
  // flash of the wrong interval, not just a wrong label, even though a
  // *synchronous* (useLayoutEffect) state update happens before the
  // browser paints. React still runs a mounted child's passive effects
  // for whatever commit actually happened, even one instantly superseded
  // pre-paint — so the fetch fires and its response still lands. Not
  // mounting the chart until the real timeframe is known sidesteps this
  // entirely: it mounts for the first time already correct, so its
  // initial fetch only ever happens once, for the right interval.
  const [timeframeReady, setTimeframeReady] = useState(false);
  const { prices } = useLivePrices();

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(TIMEFRAME_STORAGE_KEY);
    if (isValidTimeframe(stored)) setTimeframeState(stored);
    setTimeframeReady(true);
  }, []);

  function handleTimeframeChange(tf: Timeframe) {
    setTimeframeState(tf);
    try {
      window.localStorage.setItem(TIMEFRAME_STORAGE_KEY, tf);
    } catch {
      // Storage unavailable (private mode, quota) — the timeframe still
      // works for the rest of this session, just won't persist past reload.
    }
  }

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

        {/* SpotOrdersPanel below has its own fixed height and internal
            scroll (it never grows with row count), so the chart's
            flex-1/min-h-0 always resolves to the exact same remaining
            space regardless of tab or order count — no elastic squeeze,
            no resize on tab switch. overflow-y-auto here is just a
            fallback for viewports too short to fit chart + orders at
            all, so that case degrades to a scrollbar instead of clipped,
            unreachable content — it doesn't engage in the normal case. */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <TerminalTopbar />
          {timeframeReady ? (
            <>
              <ChartHeader
                displayName={displayName}
                price={ticker?.price}
                changePercent={ticker?.changePercent24h}
                timeframe={timeframe}
                onTimeframeChange={handleTimeframeChange}
              />
              <div className="min-h-0 flex-1">
                <CandlestickChart
                  symbol={symbol}
                  timeframe={timeframe}
                  livePrice={ticker?.price}
                />
              </div>
            </>
          ) : (
            <>
              {/* Same border/padding as ChartHeader's own outer element
                  (just no timeframe-dependent content yet) so this takes
                  up the exact same height — swapping it for the real
                  ChartHeader a moment later causes no layout shift. This
                  (plus not mounting CandlestickChart below) is what keeps
                  the restored timeframe from ever flashing "1h" first: the
                  server can't know localStorage's value, so the raw
                  pre-hydration HTML must render *something* — showing a
                  neutral placeholder instead of a wrong, real timeframe
                  label is the only way to avoid a visibly incorrect
                  flash while that's being resolved. */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3" />
              <div className="min-h-0 flex-1">
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 text-sm text-muted">
                    {t("trading.chart.loading")}
                  </div>
                </div>
              </div>
            </>
          )}
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
