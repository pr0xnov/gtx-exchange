"use client";

import { cn, formatPrice } from "@/lib/utils";
import { TIMEFRAMES, Timeframe } from "@/components/trading/candlestick-chart";

export function ChartHeader({
  displayName,
  price,
  changePercent,
  timeframe,
  onTimeframeChange,
}: {
  displayName: string;
  price?: number;
  changePercent?: number;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}) {
  const up = (changePercent ?? 0) >= 0;

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-foreground">{displayName}</h2>
        <span
          className={cn(
            "font-tabular text-lg font-bold transition-colors",
            up ? "text-primary" : "text-danger"
          )}
        >
          {price ? formatPrice(price, price < 10 ? 4 : 2) : "—"}
        </span>
        {changePercent !== undefined && (
          <span
            className={cn(
              "font-tabular text-xs font-medium",
              up ? "text-primary" : "text-danger"
            )}
          >
            {up ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => onTimeframeChange(tf.value)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              timeframe === tf.value
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>
    </div>
  );
}
