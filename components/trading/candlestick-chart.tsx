"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1D", value: "1d" },
];

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastCandleRef = useRef<Candle | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up chart instance once.
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9CA3AF",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      timeScale: { borderColor: "#1F2937", timeVisible: true },
      rightPriceScale: { borderColor: "#1F2937" },
      crosshair: { mode: 0 },
      autoSize: true,
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

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Load historical candles whenever symbol/timeframe changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/markets/klines?symbol=${symbol}&interval=${timeframe}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json.success) return;
        const candles: Candle[] = json.data;
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
        lastCandleRef.current = candles[candles.length - 1] ?? null;
        chartRef.current?.timeScale().fitContent();
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [symbol, timeframe]);

  // Live-update the last candle's close price as new ticks arrive.
  useEffect(() => {
    if (!livePrice || !lastCandleRef.current || !seriesRef.current) return;
    const last = lastCandleRef.current;
    const updated: Candle = {
      ...last,
      close: livePrice,
      high: Math.max(last.high, livePrice),
      low: Math.min(last.low, livePrice),
    };
    lastCandleRef.current = updated;
    seriesRef.current.update({
      time: updated.time as never,
      open: updated.open,
      high: updated.high,
      low: updated.low,
      close: updated.close,
    });
  }, [livePrice]);

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 text-sm text-muted">
          Loading chart…
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
