"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { CoinIcon } from "@/components/markets/coin-icon";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";
import { quoteVolumeOf, tradingHref, type EnrichedMarket } from "@/lib/markets/derive";
import { cn, formatCompactUsd, formatPercent, formatPrice } from "@/lib/utils";

// "approximately one card every 4-6 seconds" — mid-point of that range.
const AUTOPLAY_INTERVAL_MS = 5000;
// "resume after approximately 5-8 seconds of inactivity" — mid-point.
const RESUME_DELAY_MS = 6500;
// How close to the end (px) counts as "there" for the loop-back check —
// scrollWidth/clientWidth arithmetic rarely lands on an exact integer.
const END_THRESHOLD_PX = 24;
const SKELETON_COUNT = 4;

// Every complete card visible, no partial "peek" card — width is always
// an exact fraction of the track (100% / N cards, minus its share of the
// gaps), so N cards always fit flush regardless of the container's real
// pixel width: 1 on mobile, 2 from sm, 3 from lg, 4 from xl. The 1rem in
// each calc must match the track's own gap-4 below, or the last card
// would creep past the edge by the rounding error.
const CARD_WIDTH_CLASS =
  "w-full shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]";

function CarouselCard({
  row,
  isAuthenticated,
}: {
  row: EnrichedMarket;
  isAuthenticated: boolean;
}) {
  const { t } = useLocale();
  const up = row.change24h >= 0;
  const volume = quoteVolumeOf(row);

  return (
    <Link
      href={tradingHref(row.symbol, isAuthenticated)}
      data-carousel-card
      className={cn(
        CARD_WIDTH_CLASS,
        "rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <CoinIcon symbol={row.base} />
        {row.base}/USDT
      </div>
      <div className="font-tabular mt-2 text-xl font-bold text-foreground">
        {formatPrice(row.price, row.price < 10 ? 4 : 2)}
      </div>
      <div
        className={cn(
          "font-tabular mt-1 text-sm font-bold",
          up ? "text-primary" : "text-danger"
        )}
      >
        {formatPercent(row.change24h)}
      </div>
      <div className="mt-1 text-xs text-muted">
        {t("analytics.volume24hLabel")} {volume !== null ? formatCompactUsd(volume) : "—"}
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className={cn(CARD_WIDTH_CLASS, "rounded-2xl border border-border bg-card p-4")}>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-6 w-24" />
      <Skeleton className="mt-2 h-4 w-14" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

/**
 * Horizontal card strip for /analytics's "Обзор рынка" carousels — plain
 * CSS overflow-x + scroll-snap does the actual scrolling (native wheel/
 * trackpad and touch-swipe come for free from that, no library), with a
 * small ref-based interval for the slow auto-advance and a couple of
 * pointer handlers for desktop click-drag. No carousel/animation library,
 * no arrow buttons — native scroll/swipe/drag is the only control.
 */
export function MarketCarousel({
  title,
  rows,
  isLoading,
  isAuthenticated,
}: {
  title: string;
  rows: EnrichedMarket[];
  isLoading: boolean;
  isAuthenticated: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ startX: number; startScrollLeft: number; moved: boolean } | null>(
    null
  );
  // Set right after a real drag ends, so the click the browser fires on
  // release (over whatever card the pointer lands on) can be swallowed —
  // a drag must only scroll, never navigate. Cleared once consumed.
  const justDragged = useRef(false);

  const [hovering, setHovering] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Not implemented in every environment (notably jsdom, used by this
    // project's own component tests) — feature-detect rather than assume
    // it exists, same as any other optional browser API.
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function markInteraction() {
    setInteracting(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setInteracting(false), RESUME_DELAY_MS);
  }

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    []
  );

  function cardStep(el: HTMLDivElement): number {
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = 16; // matches the gap-4 below
    return card ? card.offsetWidth + gap : el.clientWidth * 0.8;
  }

  // Slow auto-advance — paused on hover, on any manual interaction (for a
  // cooldown), or when the OS/browser asks for reduced motion. Always
  // moves by exactly one full card + gap, so it can never stop mid-card.
  useEffect(() => {
    if (hovering || interacting || reducedMotion) return;
    const el = scrollerRef.current;
    if (!el) return;

    const id = setInterval(() => {
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - END_THRESHOLD_PX;
      if (atEnd) {
        // Simple restart rather than cloning cards for an "infinite" loop —
        // a smooth scroll back to the start reads as intentional, not a
        // glitch, without the complexity of duplicated DOM nodes.
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: cardStep(el), behavior: "smooth" });
      }
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(id);
  }, [hovering, interacting, reducedMotion, rows.length]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startScrollLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const el = scrollerRef.current;
    if (!el || !drag.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.startScrollLeft - dx;
  }

  function onPointerUp() {
    if (drag.current?.moved) {
      markInteraction();
      justDragged.current = true;
    }
    drag.current = null;
  }

  // Capture phase so this runs before the Link's own navigation — a click
  // that's really the tail end of a drag must scroll only.
  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    if (justDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      justDragged.current = false;
    }
  }

  const showSkeletons = isLoading && rows.length === 0;

  return (
    <div className="mt-6 first:mt-4">
      <h3 className="text-sm font-semibold text-muted">{title}</h3>
      <div
        className="mt-3"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onWheel={markInteraction}
          onTouchStart={markInteraction}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onClickCapture={onClickCapture}
        >
          {showSkeletons
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <SkeletonCard key={i} />
              ))
            : rows.map((row) => (
                <CarouselCard
                  key={row.symbol}
                  row={row}
                  isAuthenticated={isAuthenticated}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
