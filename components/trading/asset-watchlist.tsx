"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CoinIcon } from "@/components/markets/coin-icon";
import { MARKET_REGISTRY, TRACKED_SYMBOLS } from "@/lib/binance/client";
import { LiveTicker } from "@/hooks/use-live-prices";

// Single source of truth for every tracked symbol's name/base/display
// form: MARKET_REGISTRY (lib/binance/client.ts) — the same registry
// Markets is built on. Previously this file hand-typed its own 8-entry
// DISPLAY_NAMES map, which is why coins added after that map was written
// showed up with no name at all (`DISPLAY_NAMES[symbol]` was `undefined`)
// and no icon (this file never rendered one). Deriving from the registry
// means every symbol added there — 8 or 800 — resolves correctly here
// with zero further edits to this file.
const REGISTRY_BY_SYMBOL = new Map(MARKET_REGISTRY.map((e) => [e.symbol, e]));

// Kept as a flat symbol -> "BASE/USD" map and still exported under this
// exact name because trading-terminal.tsx already imports it for the
// chart header / order panel pair labels — deriving it from the same
// registry fixes those for every symbol too, with no change needed
// there.
const DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  MARKET_REGISTRY.map((e) => [e.symbol, `${e.baseAsset}/USD`])
);

export function AssetWatchlist({
  prices,
  selected,
  onSelect,
}: {
  prices: Record<string, LiveTicker>;
  selected: string;
  onSelect: (symbol: string) => void;
}) {
  const [search, setSearch] = useState("");

  const symbols = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return TRACKED_SYMBOLS;
    return TRACKED_SYMBOLS.filter((s) => {
      const entry = REGISTRY_BY_SYMBOL.get(s);
      return (
        (DISPLAY_NAMES[s] ?? s).toLowerCase().includes(q) ||
        (entry?.name ?? "").toLowerCase().includes(q) ||
        s.toLowerCase().includes(q)
      );
    });
  }, [search]);

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-border">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search"
            className="h-9 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {symbols.map((symbol) => {
          const ticker = prices[symbol];
          const up = (ticker?.changePercent24h ?? 0) >= 0;
          const active = selected === symbol;
          const entry = REGISTRY_BY_SYMBOL.get(symbol);
          return (
            <button
              key={symbol}
              onClick={() => onSelect(symbol)}
              className={cn(
                "flex w-full items-center justify-between gap-2 border-b border-border/50 px-4 py-3 text-left transition-colors",
                active ? "bg-primary/10" : "hover:bg-white/[0.02]"
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <CoinIcon symbol={entry?.baseAsset ?? symbol} />
                <div className="min-w-0">
                  <div
                    className={cn(
                      "truncate text-sm font-medium",
                      active ? "text-primary" : "text-foreground"
                    )}
                  >
                    {DISPLAY_NAMES[symbol] ?? symbol}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {entry?.name ?? symbol}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-tabular text-xs text-foreground">
                  {ticker ? formatPrice(ticker.price, ticker.price < 10 ? 4 : 2) : "—"}
                </div>
                <div
                  className={cn(
                    "font-tabular text-[11px]",
                    up ? "text-primary" : "text-danger"
                  )}
                >
                  {ticker ? `${up ? "+" : ""}${ticker.changePercent24h.toFixed(2)}%` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { DISPLAY_NAMES };
