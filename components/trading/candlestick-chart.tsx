"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LogicalRange,
} from "lightweight-charts";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";

export type Timeframe = "5s" | "30s" | "1m" | "15m" | "1h" | "4h" | "1d" | "1w";

export const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: "5s", value: "5s" },
  { label: "30s", value: "30s" },
  { label: "1m", value: "1m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
];

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "5s": 5,
  "30s": 30,
  "1m": 60,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
};

// Bars to fetch per page, calibrated per timeframe so the default view
// (fitContent() over exactly this many bars) covers a sensible real-world
// window instead of one flat count for every interval. A flat 500, as this
// used to be, means 500 hourly candles (~21 days) got squeezed into the
// same on-screen width as 500 five-second candles (~42 minutes) — at that
// zoom level lightweight-charts auto-coarsens its axis labels to
// day-granularity ticks, so "1h" visually read as a multi-week daily
// chart even though the underlying candles really were hourly. The chart
// still pages further back on demand as the user scrolls — see
// loadOlderPage below — using this same per-timeframe page size.
const TIMEFRAME_DEFAULT_BARS: Record<Timeframe, number> = {
  "5s": 180, // ~15 minutes
  "30s": 100, // ~50 minutes
  "1m": 180, // ~3 hours
  "15m": 192, // ~2 days
  "1h": 168, // ~7 days
  "4h": 270, // ~45 days
  "1d": 270, // ~9 months
  "1w": 182, // ~3.5 years
};
// Start fetching the next page once the visible range gets this close to
// the oldest loaded bar (index 0).
const PREFETCH_THRESHOLD_BARS = 10;

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchCandlePage(
  symbol: string,
  timeframe: Timeframe,
  endTimeMs?: number
): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol,
    interval: timeframe,
    limit: String(TIMEFRAME_DEFAULT_BARS[timeframe]),
  });
  if (endTimeMs) params.set("endTime", String(endTimeMs));

  const res = await fetch(`/api/markets/klines?${params.toString()}`);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load candles");
  return json.data as Candle[];
}

export function CandlestickChart({
  symbol,
  timeframe,
  livePrice,
}: {
  symbol: string;
  timeframe: Timeframe;
  livePrice?: number;
}) {
  const { t } = useLocale();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Full accumulated dataset for the current symbol/timeframe, ascending
  // by time. A ref, not state — updated imperatively so ticks/pagination
  // never trigger a React re-render of this component.
  const candlesRef = useRef<Candle[]>([]);
  const loadingMoreRef = useRef(false);
  const exhaustedRef = useRef(false); // true once Binance has no older data left
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  // Bumped every time symbol/timeframe changes (and once more on unmount —
  // see the chart-setup effect's cleanup below); loadOlderPage captures it
  // before its async fetch and checks it again after, so a stale response
  // (user switched pairs/timeframe, or navigated away, while an older-page
  // request was still in flight) is discarded instead of being spliced
  // onto the new symbol's data or touching refs after unmount.
  // readyGenerationRef records which generation's initial load has
  // actually landed, so the live-tick effect can tell it's not safe to
  // touch candlesRef/series yet during that same async gap. Both are plain
  // numbers on a ref, not subscriptions or timers, so there's nothing to
  // explicitly tear down for them beyond the generation bump above.
  const generationRef = useRef(0);
  const readyGenerationRef = useRef(-1);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    symbolRef.current = symbol;
    timeframeRef.current = timeframe;
  }, [symbol, timeframe]);

  const applyData = useCallback((candles: Candle[]) => {
    // Defense in depth: lightweight-charts throws a hard internal assertion
    // if handed a non-ascending or duplicate-timestamp series. Verify here,
    // at the single choke point every candle array passes through, and
    // silently drop the batch rather than ever calling setData with it.
    for (let i = 1; i < candles.length; i++) {
      if (candles[i]!.time <= candles[i - 1]!.time) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[chart] dropped out-of-order candle batch");
        }
        return;
      }
    }

    // lightweight-charts defaults every price series to 2-decimal
    // formatting, which rounds a sub-$10 price like XLM's ~0.1653 down to a
    // meaningless "0.17" on the right-hand price scale. Reuses the same
    // <10 -> 4dp convention ChartHeader/mini-market-table's
    // formatPrice(price, price < 10 ? 4 : 2) already applies elsewhere, so
    // BTC-sized prices still read as "64,857.00" while cheap assets keep
    // their significant digits.
    const last = candles[candles.length - 1];
    if (last && seriesRef.current) {
      const precision = last.close < 10 ? 4 : 2;
      seriesRef.current.applyOptions({
        priceFormat: { type: "price", precision, minMove: 1 / 10 ** precision },
      });
    }

    seriesRef.current?.setData(
      candles.map((c) => ({
        time: c.time as never,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    volumeSeriesRef.current?.setData(
      candles.map((c) => ({
        time: c.time as never,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
      }))
    );
  }, []);

  // Fetches the next older page and prepends it, preserving the user's
  // current scroll position so the view doesn't jump. This is what lets
  // the user keep scrolling back — including well past a year — for any
  // timeframe, instead of only ever seeing the most recent bars.
  const loadOlderPage = useCallback(async () => {
    const requestGeneration = generationRef.current;
    const requestSymbol = symbolRef.current;
    const requestTimeframe = timeframeRef.current;
    const earliest = candlesRef.current[0];
    if (!earliest || loadingMoreRef.current || exhaustedRef.current) return;

    loadingMoreRef.current = true;
    try {
      const older = await fetchCandlePage(
        requestSymbol,
        requestTimeframe,
        earliest.time * 1000 - 1
      );

      // The user switched symbol/timeframe (or unmounted the chart) while
      // this request was in flight — it no longer corresponds to what's on
      // screen. Discard it rather than splicing stale data onto the new
      // symbol's dataset.
      if (requestGeneration !== generationRef.current) return;

      const fresh = older.filter((c) => c.time < earliest.time);
      if (fresh.length === 0) {
        exhaustedRef.current = true;
        return;
      }

      const combined = [...fresh, ...candlesRef.current];
      candlesRef.current = combined;

      const chart = chartRef.current;
      const range = chart?.timeScale().getVisibleLogicalRange();
      applyData(combined);
      if (chart && range) {
        chart.timeScale().setVisibleLogicalRange({
          from: range.from + fresh.length,
          to: range.to + fresh.length,
        });
      }
    } catch {
      // Transient network/API hiccup — the next scroll-to-edge event
      // will simply retry.
    } finally {
      loadingMoreRef.current = false;
    }
  }, [applyData]);

  // Set up the chart instance once.
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9CA3AF",
        fontSize: 11,
        // Attribution moved to the site Footer (see components/marketing/footer.tsx)
        // per the library's licence terms — disabling here doesn't remove the
        // requirement, just relocates where it's satisfied.
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      timeScale: { borderColor: "#1F2937", timeVisible: true },
      rightPriceScale: { borderColor: "#1F2937" },
      crosshair: { mode: 0 },
      autoSize: true,
      // Explicit for clarity — these are the defaults, but Task 3 requires
      // wheel-zoom and drag-pan to keep working as pagination is added.
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22C55E",
      downColor: "#EF4444",
      borderVisible: false,
      wickUpColor: "#22C55E",
      wickDownColor: "#EF4444",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#22C55E",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Candle/volume colors (green/down-red/green) stay constant across
    // themes on purpose — see the theme-color effect below for the
    // chrome (grid/axis/text) that does need to flip with Light/Dark.

    const handleRangeChange = (range: LogicalRange | null) => {
      if (!range) return;
      if (range.from < PREFETCH_THRESHOLD_BARS) {
        void loadOlderPage();
      }
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      // Invalidate any in-flight loadOlderPage/initial-load request so its
      // continuation sees a generation mismatch and bails out instead of
      // touching candlesRef/series after this component is gone.
      generationRef.current += 1;
    };
  }, [loadOlderPage]);

  // Re-colors the chart's chrome (grid lines, axis text/border) in place
  // via applyOptions() whenever the theme flips — deliberately a separate,
  // lightweight effect from chart setup above rather than adding `theme`
  // to that effect's deps, which would tear down and recreate the whole
  // chart (losing zoom/pan position) just to recolor grid lines.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const isDark = theme === "dark";
    chart.applyOptions({
      layout: { textColor: isDark ? "#9CA3AF" : "#6B7280" },
      grid: {
        vertLines: { color: isDark ? "#1F2937" : "#E5E7EB" },
        horzLines: { color: isDark ? "#1F2937" : "#E5E7EB" },
      },
      timeScale: { borderColor: isDark ? "#1F2937" : "#E5E7EB" },
      rightPriceScale: { borderColor: isDark ? "#1F2937" : "#E5E7EB" },
    });
  }, [theme]);

  // Load the most recent page whenever symbol/timeframe changes.
  useEffect(() => {
    const generation = ++generationRef.current;
    let cancelled = false;
    setLoading(true);
    exhaustedRef.current = false;
    candlesRef.current = [];

    fetchCandlePage(symbol, timeframe)
      .then((candles) => {
        if (cancelled) return;
        candlesRef.current = candles;
        applyData(candles);
        chartRef.current?.timeScale().fitContent();
        readyGenerationRef.current = generation;
      })
      .catch(() => {
        // Leave the chart empty; the effect reruns on the next
        // symbol/timeframe change. Still mark this generation "ready" so
        // live ticks (which don't need history) aren't blocked forever.
        if (!cancelled) readyGenerationRef.current = generation;
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe, applyData]);

  // Live-update from the WebSocket ticker (see hooks/use-live-prices.ts).
  // Rolls over to a brand new bar once real time crosses the current
  // timeframe's bucket boundary, instead of extending one bar forever.
  useEffect(() => {
    if (livePrice == null || !seriesRef.current) return;
    // Symbol/timeframe just changed and the new history hasn't landed yet
    // (candlesRef.current is either stale or empty) — applying a live
    // tick right now would either update the wrong series' last bar or
    // desync candlesRef.current from what's actually on screen.
    if (readyGenerationRef.current !== generationRef.current) return;

    const bucketSeconds = TIMEFRAME_SECONDS[timeframe];
    const bucketTime = Math.floor(Date.now() / 1000 / bucketSeconds) * bucketSeconds;
    const candles = candlesRef.current;
    const last = candles[candles.length - 1];

    if (last && bucketTime === last.time) {
      const updated: Candle = {
        ...last,
        close: livePrice,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
      };
      candles[candles.length - 1] = updated;
      seriesRef.current.update({
        time: updated.time as never,
        open: updated.open,
        high: updated.high,
        low: updated.low,
        close: updated.close,
      });
    } else if (!last || bucketTime > last.time) {
      const fresh: Candle = {
        time: bucketTime,
        open: livePrice,
        high: livePrice,
        low: livePrice,
        close: livePrice,
        volume: 0,
      };
      candlesRef.current = [...candles, fresh];
      seriesRef.current.update({
        time: fresh.time as never,
        open: fresh.open,
        high: fresh.high,
        low: fresh.low,
        close: fresh.close,
      });
      volumeSeriesRef.current?.update({
        time: fresh.time as never,
        value: 0,
        color: "rgba(34,197,94,0.4)",
      });
    }
    // else: a stale tick from just before a timeframe switch — ignore.
  }, [livePrice, timeframe]);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 text-sm text-muted">
          {t("trading.chart.loading")}
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
