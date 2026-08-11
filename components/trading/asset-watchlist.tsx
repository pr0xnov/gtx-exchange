"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { TRACKED_SYMBOLS } from "@/lib/binance/client";
import { LiveTicker } from "@/hooks/use-live-prices";

const DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: "BTC/USD",
  ETHUSDT: "ETH/USD",
  BNBUSDT: "BNB/USD",
  SOLUSDT: "SOL/USD",
  XRPUSDT: "XRP/USD",
  ADAUSDT: "ADA/USD",
  DOGEUSDT: "DOGE/USD",
  LTCUSDT: "LTC/USD",
};

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

  const symbols = useMemo(
    () =>
      TRACKED_SYMBOLS.filter((s) =>
        (DISPLAY_NAMES[s] ?? s).toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

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
          return (
            <button
              key={symbol}
              onClick={() => onSelect(symbol)}
              className={cn(
                "flex w-full items-center justify-between border-b border-border/50 px-4 py-3 text-left transition-colors",
                active ? "bg-primary/10" : "hover:bg-white/[0.02]"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-primary" : "text-foreground"
                )}
              >
                {DISPLAY_NAMES[symbol]}
              </span>
              <div className="text-right">
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
