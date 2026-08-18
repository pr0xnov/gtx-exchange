/**
 * Binance market data client.
 *
 * - REST is used once at boot (and on-demand) to snapshot current prices.
 * - The public combined-stream WebSocket is used for live ticker updates.
 *
 * No API key is required — these are Binance's public market data endpoints.
 */

export interface MarketRegistryEntry {
  /** Binance trading pair, e.g. "BTCUSDT". */
  symbol: string;
  /** Base asset ticker, e.g. "BTC". */
  baseAsset: string;
  /** Friendly display name, e.g. "Bitcoin". */
  name: string;
}

/**
 * The single source of truth for every USDT pair this app tracks —
 * seeded into `Asset`, subscribed to on the combined WS ticker stream,
 * and read by Markets. Add/remove a coin here and it's live everywhere.
 *
 * All 95 entries are real, currently-active Binance USDT spot pairs
 * (verified against a live `GET /api/v3/exchangeInfo` + `GET /api/v3/
 * ticker/24hr` pull — TRADING status, spot-tradable, non-zero 24h
 * volume), not an arbitrary/padded list. Deliberately excludes: leveraged
 * tokens (*UP/DOWN/BULL/BEAR*USDT), Binance's tokenized-stock "xStocks"
 * products, and stablecoin-vs-stablecoin pairs (USDC, FDUSD, etc.) —
 * none of those are "cryptocurrencies" in the sense this dashboard means.
 * Ordered by real 24h quote volume at the time this list was compiled
 * (highest first); order has no functional meaning elsewhere.
 */
export const MARKET_REGISTRY: readonly MarketRegistryEntry[] = [
  { symbol: "BTCUSDT", baseAsset: "BTC", name: "Bitcoin" },
  { symbol: "ETHUSDT", baseAsset: "ETH", name: "Ethereum" },
  { symbol: "SOLUSDT", baseAsset: "SOL", name: "Solana" },
  { symbol: "BNBUSDT", baseAsset: "BNB", name: "BNB" },
  { symbol: "XRPUSDT", baseAsset: "XRP", name: "XRP" },
  { symbol: "ZECUSDT", baseAsset: "ZEC", name: "Zcash" },
  { symbol: "TRXUSDT", baseAsset: "TRX", name: "TRON" },
  { symbol: "DOGEUSDT", baseAsset: "DOGE", name: "Dogecoin" },
  { symbol: "LINKUSDT", baseAsset: "LINK", name: "Chainlink" },
  { symbol: "WLDUSDT", baseAsset: "WLD", name: "Worldcoin" },
  { symbol: "ADAUSDT", baseAsset: "ADA", name: "Cardano" },
  { symbol: "NEARUSDT", baseAsset: "NEAR", name: "NEAR Protocol" },
  { symbol: "SUIUSDT", baseAsset: "SUI", name: "Sui" },
  { symbol: "UNIUSDT", baseAsset: "UNI", name: "Uniswap" },
  { symbol: "AVAXUSDT", baseAsset: "AVAX", name: "Avalanche" },
  { symbol: "ACEUSDT", baseAsset: "ACE", name: "Fusionist" },
  { symbol: "BICOUSDT", baseAsset: "BICO", name: "Biconomy" },
  { symbol: "PEPEUSDT", baseAsset: "PEPE", name: "Pepe" },
  { symbol: "LTCUSDT", baseAsset: "LTC", name: "Litecoin" },
  { symbol: "ENAUSDT", baseAsset: "ENA", name: "Ethena" },
  { symbol: "AAVEUSDT", baseAsset: "AAVE", name: "Aave" },
  { symbol: "XLMUSDT", baseAsset: "XLM", name: "Stellar" },
  { symbol: "BCHUSDT", baseAsset: "BCH", name: "Bitcoin Cash" },
  { symbol: "ONDOUSDT", baseAsset: "ONDO", name: "Ondo" },
  { symbol: "WBTCUSDT", baseAsset: "WBTC", name: "Wrapped Bitcoin" },
  { symbol: "ATOMUSDT", baseAsset: "ATOM", name: "Cosmos" },
  { symbol: "DEXEUSDT", baseAsset: "DEXE", name: "DeXe" },
  { symbol: "HBARUSDT", baseAsset: "HBAR", name: "Hedera" },
  { symbol: "CRVUSDT", baseAsset: "CRV", name: "Curve DAO Token" },
  { symbol: "FETUSDT", baseAsset: "FET", name: "Fetch.ai" },
  { symbol: "SCRTUSDT", baseAsset: "SCRT", name: "Secret" },
  { symbol: "STORJUSDT", baseAsset: "STORJ", name: "Storj" },
  { symbol: "ARBUSDT", baseAsset: "ARB", name: "Arbitrum" },
  { symbol: "DODOUSDT", baseAsset: "DODO", name: "DODO" },
  { symbol: "FILUSDT", baseAsset: "FIL", name: "Filecoin" },
  { symbol: "POLUSDT", baseAsset: "POL", name: "Polygon" },
  { symbol: "BONKUSDT", baseAsset: "BONK", name: "Bonk" },
  { symbol: "DOTUSDT", baseAsset: "DOT", name: "Polkadot" },
  { symbol: "APTUSDT", baseAsset: "APT", name: "Aptos" },
  { symbol: "NOTUSDT", baseAsset: "NOT", name: "Notcoin" },
  { symbol: "JSTUSDT", baseAsset: "JST", name: "JUST" },
  { symbol: "TIAUSDT", baseAsset: "TIA", name: "Celestia" },
  { symbol: "OPUSDT", baseAsset: "OP", name: "Optimism" },
  { symbol: "INJUSDT", baseAsset: "INJ", name: "Injective" },
  { symbol: "ICPUSDT", baseAsset: "ICP", name: "Internet Computer" },
  { symbol: "PNUTUSDT", baseAsset: "PNUT", name: "Peanut the Squirrel" },
  { symbol: "ONEUSDT", baseAsset: "ONE", name: "Harmony" },
  { symbol: "MOVRUSDT", baseAsset: "MOVR", name: "Moonriver" },
  { symbol: "JUPUSDT", baseAsset: "JUP", name: "Jupiter" },
  { symbol: "VANRYUSDT", baseAsset: "VANRY", name: "Vanar Chain" },
  { symbol: "SHIBUSDT", baseAsset: "SHIB", name: "Shiba Inu" },
  { symbol: "LDOUSDT", baseAsset: "LDO", name: "Lido DAO" },
  { symbol: "SEIUSDT", baseAsset: "SEI", name: "Sei" },
  { symbol: "RENDERUSDT", baseAsset: "RENDER", name: "Render" },
  { symbol: "DASHUSDT", baseAsset: "DASH", name: "Dash" },
  { symbol: "PYTHUSDT", baseAsset: "PYTH", name: "Pyth Network" },
  { symbol: "ALGOUSDT", baseAsset: "ALGO", name: "Algorand" },
  { symbol: "STRKUSDT", baseAsset: "STRK", name: "Starknet" },
  { symbol: "ETCUSDT", baseAsset: "ETC", name: "Ethereum Classic" },
  { symbol: "GALAUSDT", baseAsset: "GALA", name: "Gala" },
  { symbol: "PIXELUSDT", baseAsset: "PIXEL", name: "Pixels" },
  { symbol: "EGLDUSDT", baseAsset: "EGLD", name: "MultiversX" },
  { symbol: "CHZUSDT", baseAsset: "CHZ", name: "Chiliz" },
  { symbol: "PENDLEUSDT", baseAsset: "PENDLE", name: "Pendle" },
  { symbol: "KAVAUSDT", baseAsset: "KAVA", name: "Kava" },
  { symbol: "RUNEUSDT", baseAsset: "RUNE", name: "THORChain" },
  { symbol: "GRTUSDT", baseAsset: "GRT", name: "The Graph" },
  { symbol: "SUSDT", baseAsset: "S", name: "Sonic" },
  { symbol: "VETUSDT", baseAsset: "VET", name: "VeChain" },
  { symbol: "BATUSDT", baseAsset: "BAT", name: "Basic Attention Token" },
  { symbol: "AXSUSDT", baseAsset: "AXS", name: "Axie Infinity" },
  { symbol: "FLOWUSDT", baseAsset: "FLOW", name: "Flow" },
  { symbol: "IOTAUSDT", baseAsset: "IOTA", name: "IOTA" },
  { symbol: "ROSEUSDT", baseAsset: "ROSE", name: "Oasis Network" },
  { symbol: "SANDUSDT", baseAsset: "SAND", name: "The Sandbox" },
  { symbol: "THETAUSDT", baseAsset: "THETA", name: "Theta Network" },
  { symbol: "ENJUSDT", baseAsset: "ENJ", name: "Enjin Coin" },
  { symbol: "ALTUSDT", baseAsset: "ALT", name: "AltLayer" },
  { symbol: "STXUSDT", baseAsset: "STX", name: "Stacks" },
  { symbol: "MANTAUSDT", baseAsset: "MANTA", name: "Manta Network" },
  { symbol: "NEOUSDT", baseAsset: "NEO", name: "NEO" },
  { symbol: "QNTUSDT", baseAsset: "QNT", name: "Quant" },
  { symbol: "SNXUSDT", baseAsset: "SNX", name: "Synthetix" },
  { symbol: "ZILUSDT", baseAsset: "ZIL", name: "Zilliqa" },
  { symbol: "PORTALUSDT", baseAsset: "PORTAL", name: "Portal" },
  { symbol: "MANAUSDT", baseAsset: "MANA", name: "Decentraland" },
  { symbol: "XTZUSDT", baseAsset: "XTZ", name: "Tezos" },
  { symbol: "COMPUSDT", baseAsset: "COMP", name: "Compound" },
  { symbol: "IMXUSDT", baseAsset: "IMX", name: "Immutable" },
  { symbol: "YFIUSDT", baseAsset: "YFI", name: "yearn.finance" },
  { symbol: "KSMUSDT", baseAsset: "KSM", name: "Kusama" },
  { symbol: "CELOUSDT", baseAsset: "CELO", name: "Celo" },
  { symbol: "ANKRUSDT", baseAsset: "ANKR", name: "Ankr" },
  { symbol: "KNCUSDT", baseAsset: "KNC", name: "Kyber Network Crystal" },
  { symbol: "ZRXUSDT", baseAsset: "ZRX", name: "0x Protocol" },
];

export const TRACKED_SYMBOLS: readonly string[] = MARKET_REGISTRY.map((e) => e.symbol);

/**
 * A small, curated shortlist of the most widely recognized majors, for
 * the Markets "Популярные" block — deliberately NOT the same as
 * TRACKED_SYMBOLS (which is now the full ~95-symbol registry), or that
 * block would just duplicate "Все криптовалюты".
 */
export const POPULAR_SYMBOLS: readonly string[] = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "TRXUSDT",
  "AVAXUSDT",
  "LINKUSDT",
];

export type TrackedSymbol = string;

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

// Native Binance kline intervals, plus "5s"/"30s" which Binance doesn't
// offer directly — we synthesize both below by aggregating Binance's
// native "1s" candles, 5 or 30 at a time respectively.
export const KLINE_INTERVALS = [
  "5s",
  "30s",
  "1m",
  "15m",
  "1h",
  "4h",
  "1d",
  "1w",
] as const;
export type KlineInterval = (typeof KLINE_INTERVALS)[number];

const SYNTHETIC_INTERVAL_SECONDS: Record<"5s" | "30s", number> = {
  "5s": 5,
  "30s": 30,
};

const BINANCE_NATIVE_INTERVAL: Record<Exclude<KlineInterval, "5s" | "30s">, string> = {
  "1m": "1m",
  "15m": "15m",
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
  if (interval === "5s" || interval === "30s") {
    // No native 5s/30s interval on Binance — aggregate from 1s candles,
    // 5 or 30 of which make up one bucket. Binance caps a single request
    // at 1000 candles, so this can return well under `limit` candles per
    // page for these specific intervals — the chart pages further back
    // to compensate (see components/trading/candlestick-chart.tsx).
    const bucketSeconds = SYNTHETIC_INTERVAL_SECONDS[interval];
    const raw = await fetchRawKlines(
      symbol,
      "1s",
      Math.min(limit * bucketSeconds, 1000),
      endTime
    );
    return aggregateCandles(raw, bucketSeconds);
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
