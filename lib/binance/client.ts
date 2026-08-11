/**
 * Binance market data client.
 *
 * - REST is used once at boot (and on-demand) to snapshot current prices.
 * - The public combined-stream WebSocket is used for live ticker updates.
 *
 * No API key is required — these are Binance's public market data endpoints.
 */

export const TRACKED_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "LTCUSDT",
] as const;

export type TrackedSymbol = (typeof TRACKED_SYMBOLS)[number];

export interface TickerSnapshot {
  symbol: string;
  price: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

const BINANCE_REST_BASE = "https://api.binance.com";
const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";

/** One-time REST snapshot of 24h ticker stats for all tracked symbols. */
export async function fetchTickerSnapshot(): Promise<TickerSnapshot[]> {
  const symbolsParam = encodeURIComponent(JSON.stringify([...TRACKED_SYMBOLS]));
  const url = `${BINANCE_REST_BASE}/api/v3/ticker/24hr?symbols=${symbolsParam}`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Binance REST error: ${res.status} ${res.statusText}`);
  }

  const raw = (await res.json()) as Array<{
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
  }>;

  return raw.map((t) => ({
    symbol: t.symbol,
    price: parseFloat(t.lastPrice),
    changePercent24h: parseFloat(t.priceChangePercent),
    high24h: parseFloat(t.highPrice),
    low24h: parseFloat(t.lowPrice),
    volume24h: parseFloat(t.volume),
  }));
}

/** Fetch historical klines (candlestick data) for the chart. */
export async function fetchKlines(
  symbol: string,
  interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
  limit = 500
): Promise<
  { time: number; open: number; high: number; low: number; close: number; volume: number }[]
> {
  const url = `${BINANCE_REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Binance klines error: ${res.status} ${res.statusText}`);
  }

  const raw = (await res.json()) as Array<
    [number, string, string, string, string, string, ...unknown[]]
  >;

  return raw.map(([openTime, open, high, low, close, volume]) => ({
    time: Math.floor(openTime / 1000),
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  }));
}

export function buildCombinedStreamUrl(symbols: readonly string[] = TRACKED_SYMBOLS): string {
  const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
  return `${BINANCE_WS_BASE}?streams=${streams}`;
}

export interface BinanceTickerEvent {
  e: "24hrTicker";
  s: string; // symbol
  c: string; // last price
  P: string; // price change percent
  h: string; // high
  l: string; // low
  v: string; // volume
}
