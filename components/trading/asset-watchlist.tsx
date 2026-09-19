"use client";

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { CoinIcon } from "@/components/markets/coin-icon";
import { useFavorites } from "@/hooks/use-favorites";
import { MARKET_REGISTRY, TRACKED_SYMBOLS } from "@/lib/binance/client";
import { LiveTicker } from "@/hooks/use-live-prices";
import { useLocale } from "@/lib/i18n/locale-context";

// Single source of truth for every tracked symbol's name/base/display
// form: MARKET_REGISTRY (lib/binance/client.ts) — the same registry
// Markets is built on. Previously this file hand-typed its own 8-entry
// DISPLAY_NAMES map, which is why coins added after that map was written
// showed up with no name at all (`DISPLAY_NAMES[symbol]` was `undefined`)
// and no icon (this file never rendered one). Deriving from the registry
// means every symbol added there — 8 or 800 — resolves correctly here
// with zero further edits to this file.
const REGISTRY_BY_SYMBOL = new Map(MARKET_REGISTRY.map((e) => [e.symbol, e]));

// Kept as a flat symbol -> "BASE/USDT" map and still exported under this
// exact name because trading-terminal.tsx already imports it for the
// chart header / order panel pair labels — deriving it from the same
// registry fixes those for every symbol too, with no change needed
// there. "USDT", not "USD": every tracked pair is Binance USDT-quoted
// (see TRACKED_SYMBOLS above — every entry ends in "USDT"), and this is
// exactly what a trader is buying/selling against on Spot, so labeling it
// "USD" was simply wrong, not a stylistic choice.
const DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  MARKET_REGISTRY.map((e) => [e.symbol, `${e.baseAsset}/USDT`])
);

export function AssetWatchlist({
  prices,
  selected,
  onSelect,
  className,
}: {
  prices: Record<string, LiveTicker>;
  selected: string;
  onSelect: (symbol: string) => void;
  /** Overrides the default desktop-sidebar sizing (w-64, h-full, right
   *  border) — used by MobilePairSelector's drawer to render the exact
   *  same list full-width with no border. */
  className?: string;
}) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  // Trading is already an authenticated-only route (middleware.ts), so
  // there's no guest case to gate on here — reuses the exact same
  // localStorage-backed favorites Markets already has (lib/markets/
  // favorites.ts via hooks/use-favorites.ts), rather than a second,
  // parallel favorites mechanism. Favoriting a pair here shows it
  // favorited on /markets too, and vice versa — one shared list.
  const { favorites, toggleFavorite } = useFavorites(true);

  // Stable partition, not a re-sort: favorites first, then the rest —
  // each group keeps TRACKED_SYMBOLS' own original relative order
  // (Array.filter preserves source order, so two filter passes over the
  // same array is enough; nothing here is compared/sorted against
  // anything else). Recomputes automatically whenever `favorites`
  // changes — toggling a star updates this on the very next render, no
  // reload needed. One single unified list, no All/Favorites tab — a
  // star just moves a row between the two halves of this same list.
  const sortedSymbols = useMemo(() => {
    const favs = TRACKED_SYMBOLS.filter((s) => favorites.has(s));
    const rest = TRACKED_SYMBOLS.filter((s) => !favorites.has(s));
    return [...favs, ...rest];
  }, [favorites]);

  // Search filters this same favorites-first list — never a separate
  // mode/view — so the favorites-first grouping (and its divider below)
  // is automatically preserved within search results too.
  const symbols = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return sortedSymbols;
    return sortedSymbols.filter((s) => {
      const entry = REGISTRY_BY_SYMBOL.get(s);
      return (
        (DISPLAY_NAMES[s] ?? s).toLowerCase().includes(q) ||
        (entry?.name ?? "").toLowerCase().includes(q) ||
        s.toLowerCase().includes(q)
      );
    });
  }, [sortedSymbols, search]);

  // Where to draw the divider between the favorited group and the rest.
  const dividerIndex = symbols.findIndex((s) => !favorites.has(s));

  return (
    <div
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border",
        className
      )}
    >
      <div className="shrink-0 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <Input
            placeholder={t("common.search")}
            className="h-9 pl-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* min-h-0 is required here: a flex child's default min-height is
          "auto" (its content's natural height), which lets this list grow
          to fit every row instead of being capped at the space actually
          available — overflow-y-auto never gets a chance to kick in, and
          rows past the bottom edge become unreachable, clipped by an
          ancestor's own overflow-hidden instead of scrolling. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {symbols.map((symbol, index) => {
          const ticker = prices[symbol];
          const up = (ticker?.changePercent24h ?? 0) >= 0;
          const active = selected === symbol;
          const entry = REGISTRY_BY_SYMBOL.get(symbol);
          const isFavorite = favorites.has(symbol);
          return (
            <div key={symbol}>
              {index === dividerIndex && index > 0 && (
                <div className="border-t border-border" />
              )}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(symbol)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(symbol);
                  }
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 border-b border-border/50 px-3 py-3 text-left outline-none transition-colors",
                  active ? "bg-primary/10" : "hover:bg-white/[0.02]"
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(symbol);
                    }}
                    className="flex shrink-0 items-center justify-center rounded-lg p-1 text-muted hover:text-foreground"
                    aria-label={
                      isFavorite
                        ? t("trading.watchlist.removeFavorite")
                        : t("trading.watchlist.addFavorite")
                    }
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        isFavorite && "fill-primary text-primary"
                      )}
                    />
                  </button>
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
                    {ticker
                      ? `${up ? "+" : ""}${ticker.changePercent24h.toFixed(2)}%`
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { DISPLAY_NAMES };
