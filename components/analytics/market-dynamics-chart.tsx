"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import { useTheme } from "@/lib/theme/theme-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { useKlines } from "@/hooks/use-api";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton";

// Fixed so switching pairs (loading -> data, or an error) never shifts
// the rest of the page.
const CHART_HEIGHT = 220;

function formatHourMinute(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * A real 24h price line — not a candlestick terminal. Reuses the exact
 * same historical-data endpoint (/api/markets/klines, see
 * components/trading/candlestick-chart.tsx) and chart library
 * (lightweight-charts, already installed) as Trading, via the new
 * useKlines() hook (hooks/use-api.ts) — just an area series instead of
 * candles/volume/pagination/live-tick handling, and no
 * pan/zoom/drawing-tool interaction (handleScroll/handleScale off).
 */
export function MarketDynamicsChart({ symbol }: { symbol: string }) {
  const { t } = useLocale();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const { data: candles, isLoading, isError } = useKlines(symbol);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    time: string;
    price: string;
  } | null>(null);

  // Chart instance created once and reused across symbol changes — only
  // its data/colors are swapped (see the effect below), so switching
  // pairs never tears down/rebuilds the chart itself.
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9CA3AF",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#1F2937" },
      },
      timeScale: { borderColor: "#1F2937", timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "#1F2937" },
      crosshair: { mode: 0 },
      autoSize: true,
      // Overview chart, not a trading terminal — no pan/zoom/drawing.
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineWidth: 2,
      lineColor: "#22C55E",
      topColor: "rgba(34,197,94,0.28)",
      bottomColor: "rgba(34,197,94,0.02)",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param.point || param.time === undefined) {
        setTooltip(null);
        return;
      }
      const point = param.seriesData.get(series);
      if (!point || !("value" in point)) {
        setTooltip(null);
        return;
      }
      setTooltip({
        x: param.point.x,
        y: param.point.y,
        time: formatHourMinute(param.time as number),
        price: formatPrice(point.value, point.value < 10 ? 4 : 2),
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Re-colors chrome in place on theme flips, same pattern as
  // components/trading/candlestick-chart.tsx.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const isDark = theme === "dark";
    chart.applyOptions({
      layout: { textColor: isDark ? "#9CA3AF" : "#6B7280" },
      grid: { horzLines: { color: isDark ? "#1F2937" : "#E5E7EB" } },
      timeScale: { borderColor: isDark ? "#1F2937" : "#E5E7EB" },
      rightPriceScale: { borderColor: isDark ? "#1F2937" : "#E5E7EB" },
    });
  }, [theme]);

  // Swap the series data (and its color, reflecting this pair's own net
  // 24h direction) whenever the selected symbol's real candles arrive.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !candles || candles.length === 0) return;

    const first = candles[0]!.close;
    const last = candles[candles.length - 1]!.close;
    const up = last >= first;
    const precision = last < 10 ? 4 : 2;

    series.applyOptions({
      lineColor: up ? "#22C55E" : "#EF4444",
      topColor: up ? "rgba(34,197,94,0.28)" : "rgba(239,68,68,0.28)",
      bottomColor: up ? "rgba(34,197,94,0.02)" : "rgba(239,68,68,0.02)",
      priceFormat: { type: "price", precision, minMove: 1 / 10 ** precision },
    });
    series.setData(candles.map((c) => ({ time: c.time as Time, value: c.close })));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  const showError = isError && !isLoading;

  return (
    <div className="relative" style={{ height: CHART_HEIGHT }}>
      <div ref={containerRef} className="h-full w-full" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-[70%] w-[92%]" />
        </div>
      )}

      {showError && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted">
          {t("analytics.dynamics.error")}
        </div>
      )}

      {tooltip && !isLoading && !showError && (
        <div
          className="pointer-events-none absolute rounded-lg border border-border bg-card px-2 py-1 text-xs shadow-card"
          style={{ left: tooltip.x + 10, top: Math.max(tooltip.y - 32, 4) }}
        >
          <div className="font-tabular font-medium text-foreground">{tooltip.price}</div>
          <div className="text-muted">{tooltip.time}</div>
        </div>
      )}
    </div>
  );
}
