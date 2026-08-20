"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
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
  const activeLabel = TIMEFRAMES.find((tf) => tf.value === timeframe)?.label ?? timeframe;

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
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-1 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-foreground outline-none data-[state=open]:text-primary">
            {activeLabel}
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 w-28 rounded-lg border border-border bg-card p-1 shadow-card"
          >
            {TIMEFRAMES.map((tf) => (
              <DropdownMenu.Item
                key={tf.value}
                onSelect={() => onTimeframeChange(tf.value)}
                className={cn(
                  "cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium outline-none transition-colors",
                  timeframe === tf.value
                    ? "bg-primary/15 text-primary"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground data-[highlighted]:bg-foreground/5 data-[highlighted]:text-foreground"
                )}
              >
                {tf.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
