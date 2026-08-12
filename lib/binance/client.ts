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

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Native Binance kline intervals, plus "30s" which Binance doesn't offer
// directly — we synthesize it below by aggregating Binance's native "1s"
// candles two at a time.
export const KLINE_INTERVALS = [
  "30s",
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
  "1w",
] as const;
export type KlineInterval = (typeof KLINE_INTERVALS)[number];

const BINANCE_NATIVE_INTERVAL: Record<Exclude<KlineInterval, "30s">, string> = {
  "1m": "1m",
  "3m": "3m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "1w",
};

/**
 * Fetch historical klines (candlestick data) for the chart.
 *
 * `endTime` (ms since epoch) pages backward in time — pass the open time
 * of the oldest candle you already have (minus 1ms) to fetch the *previous*
 * page, which is how the chart implements scroll-back / infinite history.
 */
export async function fetchKlines(
  symbol: string,
  interval: KlineInterval,
  limit = 500,
  endTime?: number
): Promise<Candle[]> {
  if (interval === "30s") {
    // No native 30s interval on Binance — aggregate from 1s candles,
    // 30 of which make up one 30s bucket. Binance caps a single request
    // at 1000 candles, so this can return well under `limit` 30s candles
    // per page for this specific interval — the chart pages further back
    // to compensate (see components/trading/candlestick-chart.tsx).
    const raw = await fetchRawKlines(symbol, "1s", Math.min(limit * 30, 1000), endTime);
    return aggregateCandles(raw, 30);
  }

  return fetchRawKlines(symbol, BINANCE_NATIVE_INTERVAL[interval], limit, endTime);
}

async function fetchRawKlines(
  symbol: string,
  binanceInterval: string,
  limit: number,
  endTime?: number
): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol,
    interval: binanceInterval,
    limit: String(limit),
  });
  if (endTime) params.set("endTime", String(endTime));

  const url = `${BINANCE_REST_BASE}/api/v3/klines?${params.toString()}`;
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

/**
 * Groups candles into `bucketSeconds`-wide, wall-clock-aligned buckets
 * (rather than pairing them positionally), so aggregated boundaries stay
 * consistent across paginated requests regardless of where a page starts.
 */
function aggregateCandles(candles: Candle[], bucketSeconds: number): Candle[] {
  const buckets = new Map<number, Candle[]>();
  for (const c of candles) {
    const bucketTime = Math.floor(c.time / bucketSeconds) * bucketSeconds;
    const group = buckets.get(bucketTime);
    if (group) group.push(c);
    else buckets.set(bucketTime, [c]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, group]) => ({
      time,
      open: group[0]!.open,
      high: Math.max(...group.map((c) => c.high)),
      low: Math.min(...group.map((c) => c.low)),
      close: group[group.length - 1]!.close,
      volume: group.reduce((sum, c) => sum + c.volume, 0),
    }));
}

export function buildCombinedStreamUrl(
  symbols: readonly string[] = TRACKED_SYMBOLS
): string {
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
