/**
 * Pure data-shaping helpers for the /markets dashboard. No React, no
 * fetching — this only combines and re-derives data that already comes
 * from the existing REST snapshot (useMarkets) and live WS ticker
 * (useLivePrices), so it's trivially unit-testable and keeps the same
 * merged list reusable across every block on the page instead of each
 * block re-deriving (or re-fetching) its own view.
 *
 * There is no market-cap data source anywhere in this project (not in
 * the Prisma `Asset` model, not in the Binance ticker payload, not on
 * the WS relay) — `EnrichedMarket` has no `marketCap` field at all for
 * that reason; nothing here ever fabricates one.
 */

import { MARKET_REGISTRY } from "@/lib/binance/client";

export interface MarketAssetLike {
  id: string;
  symbol: string;
  displaySymbol: string;
  price: number;
  change24h: number;
}

export interface LiveTickerLike {
  price: number;
  changePercent24h: number;
  volume24h: number;
}

export interface EnrichedMarket {
  id: string;
  /** Raw trading pair, e.g. "BTCUSDT" — used for /trading?symbol=... links. */
  symbol: string;
  /** Base asset ticker, e.g. "BTC". Derived from `symbol`, not fetched. */
  base: string;
  /** Friendly display name, e.g. "Bitcoin" — sourced from MARKET_REGISTRY
   *  (lib/binance/client.ts), the single shared coin registry Trading's
   *  asset-watchlist.tsx also reads from. Not part of any market-data
   *  API itself, so it falls back to the ticker for anything not in it. */
  name: string;
  /** Pair display form, e.g. "BTC/USD". */
  displaySymbol: string;
  price: number;
  change24h: number;
  /** Real 24h base-asset volume from the live ticker once it has arrived
   *  at least once; null until then. Never estimated. */
  volume24h: number | null;
}

// Friendly names come from the single shared registry (lib/binance/client.ts)
// instead of a separate local map, so every symbol added there gets a real
// name here automatically rather than falling back to its bare ticker.
const COIN_NAMES: Record<string, string> = Object.fromEntries(
  MARKET_REGISTRY.map((e) => [e.baseAsset, e.name])
);

export function baseAssetOf(symbol: string): string {
  return symbol.replace(/USDT$/, "");
}

export function mergeMarketData(
  assets: MarketAssetLike[],
  livePrices: Record<string, LiveTickerLike>
): EnrichedMarket[] {
  return assets.map((a) => {
    const live = livePrices[a.symbol];
    const base = baseAssetOf(a.symbol);
    return {
      id: a.id,
      symbol: a.symbol,
      base,
      name: COIN_NAMES[base] ?? base,
      displaySymbol: a.displaySymbol || a.symbol,
      price: live?.price ?? a.price,
      change24h: live?.changePercent24h ?? a.change24h,
      volume24h: live?.volume24h ?? null,
    };
  });
}

export function filterBySearch(rows: EnrichedMarket[], query: string): EnrichedMarket[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.base.toLowerCase().includes(q) ||
      r.symbol.toLowerCase().includes(q) ||
      r.displaySymbol.toLowerCase().includes(q)
  );
}

export type SortKey = "name" | "price" | "change24h" | "volume24h";
export type SortDirection = "asc" | "desc";

/** Nulls (volume before the first live tick) always sort to the bottom
 *  regardless of direction, instead of being coerced into a fake 0 that
 *  would misrepresent them as "lowest". */
export function sortRows(
  rows: EnrichedMarket[],
  key: SortKey,
  direction: SortDirection
): EnrichedMarket[] {
  const withRank = rows.map((row) => ({ row, missing: row[key] == null }));
  withRank.sort((a, b) => {
    if (a.missing || b.missing) return Number(a.missing) - Number(b.missing);
    const av = a.row[key] as number | string;
    const bv = b.row[key] as number | string;
    const cmp =
      typeof av === "string" ? av.localeCompare(bv as string) : av - (bv as number);
    return direction === "asc" ? cmp : -cmp;
  });
  return withRank.map((r) => r.row);
}

export function getPopular(
  rows: EnrichedMarket[],
  order: readonly string[]
): EnrichedMarket[] {
  const bySymbol = new Map(rows.map((r) => [r.symbol, r]));
  return order.map((s) => bySymbol.get(s)).filter((r): r is EnrichedMarket => Boolean(r));
}

export function getTopGainers(rows: EnrichedMarket[], n = 10): EnrichedMarket[] {
  return sortRows(rows, "change24h", "desc").slice(0, n);
}

export function getTopLosers(rows: EnrichedMarket[], n = 10): EnrichedMarket[] {
  return sortRows(rows, "change24h", "asc").slice(0, n);
}

export function getTopVolume(rows: EnrichedMarket[], n = 10): EnrichedMarket[] {
  return sortRows(rows, "volume24h", "desc").slice(0, n);
}

export function getBiggestMovers(rows: EnrichedMarket[], n = 10): EnrichedMarket[] {
  return [...rows]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, n);
}

/** Extracts a plain closing-price series from klines for the sparkline —
 *  the only shape the chart column needs, kept separate from the raw
 *  Candle type so it stays trivially testable. */
export function closesFromCandles(candles: { close: number }[]): number[] {
  return candles.map((c) => c.close);
}
