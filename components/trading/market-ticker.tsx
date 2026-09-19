"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { POPULAR_SYMBOLS } from "@/lib/binance/client";
import { DISPLAY_NAMES } from "@/components/trading/asset-watchlist";
import type { LiveTicker } from "@/hooks/use-live-prices";

// ~50s per full cycle — inside the requested 40-60s range, and a fixed
// literal (not a template-interpolated value) so Tailwind's static
// class scanner can actually see and generate this arbitrary-value
// utility at build time.
const CYCLE_CLASS = "animate-[gtx-ticker-scroll_50s_linear_infinite]";

/**
 * Continuously scrolling market ticker for the bottom of /trading.
 * Reuses the SAME `prices` map (from useLivePrices(), fed by the one
 * existing server/ws relay) TradingTerminal already passes to
 * AssetWatchlist — no second subscription, no new endpoint.
 */
export function MarketTicker({
  prices,
  onSelect,
}: {
  prices: Record<string, LiveTicker>;
  onSelect: (symbol: string) => void;
}) {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sequenceWidth, setSequenceWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Measures the FIRST rendered sequence's real pixel width so the loop
  // can translate by exactly that (never a blind -50% that would jump
  // the instant the two sequences aren't pixel-identical in width).
  useLayoutEffect(() => {
    function measure() {
      const first = trackRef.current?.firstElementChild as HTMLElement | null;
      if (first) setSequenceWidth(first.getBoundingClientRect().width);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function renderSequence(key: string, ariaHidden: boolean) {
    return (
      <div key={key} className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
        {POPULAR_SYMBOLS.map((symbol) => {
          const item = prices[symbol];
          const up = (item?.changePercent24h ?? 0) >= 0;
          return (
            <button
              key={symbol}
              type="button"
              onClick={() => onSelect(symbol)}
              tabIndex={ariaHidden ? -1 : 0}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap border-l border-border/60 px-4 py-1.5 text-xs first:border-l-0 hover:bg-white/[0.03]"
            >
              <span className="font-medium text-foreground">
                {DISPLAY_NAMES[symbol] ?? symbol}
              </span>
              <span className="font-tabular text-muted">
                {item ? formatPrice(item.price, item.price < 10 ? 4 : 2) : "—"}
              </span>
              <span className={cn("font-tabular", up ? "text-primary" : "text-danger")}>
                {item ? `${up ? "+" : ""}${item.changePercent24h.toFixed(2)}%` : ""}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Fixed to the viewport bottom, not normal document flow — a
  // persistent Trading UI element (like a trading terminal's market
  // strip), not a footer that scrolls away. z-40: above ordinary page
  // content, but below the z-50 layer this codebase already uses for
  // every modal/dropdown/Navbar (see e.g. components/shared/document-
  // list.tsx's confirm dialog, components/layout/navbar.tsx), so a
  // modal always paints over it. `overflow-hidden` only clips the
  // horizontal marquee — it never captures vertical wheel scroll (no
  // overflow-y-auto/scroll here), so hovering it never traps page
  // scrolling. TradingTerminal reserves matching bottom padding (pb-8)
  // on its own root so this never covers the last Order History row.
  // h-8 is the ticker's own content height; safe-area padding-bottom
  // (home indicator on notched phones) is added on top of that, not
  // instead of it, so the row itself never gets visually squashed.
  const safeAreaStyle = { paddingBottom: "env(safe-area-inset-bottom, 0px)" };

  if (reducedMotion) {
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex h-8 items-center overflow-x-auto border-t border-border bg-background"
        style={safeAreaStyle}
      >
        {renderSequence("static", false)}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 h-8 overflow-hidden border-t border-border bg-background"
      style={safeAreaStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className={cn("flex h-full w-max", sequenceWidth > 0 && CYCLE_CLASS)}
        style={{
          animationPlayState: paused ? "paused" : "running",
          ["--gtx-ticker-distance" as string]:
            sequenceWidth > 0 ? `-${sequenceWidth}px` : "0px",
        }}
      >
        {renderSequence("a", false)}
        {renderSequence("b", true)}
      </div>
    </div>
  );
}
