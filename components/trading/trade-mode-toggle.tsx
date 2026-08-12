"use client";

import { cn } from "@/lib/utils";

export type TradeMode = "SPOT" | "FUTURES";

export function TradeModeToggle({
  mode,
  onChange,
}: {
  mode: TradeMode;
  onChange: (mode: TradeMode) => void;
}) {
  return (
    <div className="border-b border-border p-3">
      <div className="flex w-full rounded-xl bg-surface p-1">
        {(["SPOT", "FUTURES"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
              mode === m
                ? "bg-primary/15 text-primary"
                : "text-muted hover:text-foreground"
            )}
          >
            {m === "SPOT" ? "Spot" : "Futures"}
          </button>
        ))}
      </div>
    </div>
  );
}
