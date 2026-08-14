/**
 * Guards the expanded market registry (lib/binance/client.ts) and the
 * "one combined WS stream, not one per symbol" architecture — no DB, no
 * network, pure checks on the exported constants/functions.
 */
import { describe, expect, it } from "vitest";
import {
  MARKET_REGISTRY,
  POPULAR_SYMBOLS,
  TRACKED_SYMBOLS,
  buildCombinedStreamUrl,
} from "@/lib/binance/client";
import { priceStore } from "@/lib/binance/price-store";

const ORIGINAL_8_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "LTCUSDT",
];

describe("MARKET_REGISTRY", () => {
  it("has at least 50 symbols (task minimum)", () => {
    expect(MARKET_REGISTRY.length).toBeGreaterThanOrEqual(50);
  });

  it("has no duplicate symbols", () => {
    const symbols = MARKET_REGISTRY.map((e) => e.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("has no duplicate base assets either", () => {
    const bases = MARKET_REGISTRY.map((e) => e.baseAsset);
    expect(new Set(bases).size).toBe(bases.length);
  });

  it("every symbol matches the XXXUSDT format", () => {
    for (const entry of MARKET_REGISTRY) {
      expect(entry.symbol).toMatch(/^[A-Z0-9]+USDT$/);
      expect(entry.symbol).toBe(`${entry.baseAsset}USDT`);
    }
  });

  it("every entry has a non-empty friendly name", () => {
    for (const entry of MARKET_REGISTRY) {
      expect(entry.name.length).toBeGreaterThan(0);
    }
  });

  it("still includes the original 8 tracked symbols — expansion, not replacement", () => {
    const symbols = new Set(MARKET_REGISTRY.map((e) => e.symbol));
    for (const s of ORIGINAL_8_SYMBOLS) {
      expect(symbols.has(s)).toBe(true);
    }
  });

  it("excludes leveraged-token pairs (BTCUP, ETHBULL, etc.)", () => {
    // Real Binance leveraged tokens are always {base ticker}+{UP/DOWN/
    // BULL/BEAR} — at least 5 characters (e.g. "BTCUP"). A plain regex
    // suffix check alone would false-positive on real short tickers that
    // merely end in those letters (e.g. "JUP" — Jupiter, ends in "UP"
    // but isn't remotely a leveraged token), so also require the
    // base asset to be long enough to plausibly be "ticker + suffix".
    for (const entry of MARKET_REGISTRY) {
      const looksLeveraged =
        /^(.+)(UP|DOWN|BULL|BEAR)$/.test(entry.baseAsset) && entry.baseAsset.length >= 5;
      expect(looksLeveraged).toBe(false);
    }
  });
});

describe("TRACKED_SYMBOLS", () => {
  it("is derived 1:1 from MARKET_REGISTRY (single source of truth)", () => {
    expect(TRACKED_SYMBOLS).toEqual(MARKET_REGISTRY.map((e) => e.symbol));
  });
});

describe("POPULAR_SYMBOLS", () => {
  it("is a small curated subset, not the full registry", () => {
    expect(POPULAR_SYMBOLS.length).toBeLessThan(MARKET_REGISTRY.length);
    expect(POPULAR_SYMBOLS.length).toBeGreaterThan(0);
  });

  it("every popular symbol actually exists in the registry", () => {
    const registrySymbols = new Set(MARKET_REGISTRY.map((e) => e.symbol));
    for (const s of POPULAR_SYMBOLS) {
      expect(registrySymbols.has(s)).toBe(true);
    }
  });
});

describe("buildCombinedStreamUrl — one WS connection for every symbol", () => {
  it("returns a single URL string, not one per symbol", () => {
    const url = buildCombinedStreamUrl(TRACKED_SYMBOLS);
    expect(typeof url).toBe("string");
  });

  it("encodes every tracked symbol into that one URL's combined-stream list", () => {
    const url = buildCombinedStreamUrl(TRACKED_SYMBOLS);
    for (const symbol of TRACKED_SYMBOLS) {
      expect(url).toContain(`${symbol.toLowerCase()}@ticker`);
    }
  });

  it("defaults to the full TRACKED_SYMBOLS list when called with no arguments", () => {
    const url = buildCombinedStreamUrl();
    expect(url).toBe(buildCombinedStreamUrl(TRACKED_SYMBOLS));
  });

  it("stays comfortably under Binance's 1024-stream-per-connection limit", () => {
    expect(TRACKED_SYMBOLS.length).toBeLessThan(1024);
  });
});

describe("priceStore — scales to the expanded symbol list with no per-symbol wiring", () => {
  it("all() returns exactly one entry per tracked symbol", () => {
    const all = priceStore.all();
    expect(all).toHaveLength(TRACKED_SYMBOLS.length);
    expect(new Set(all.map((s) => s.symbol)).size).toBe(TRACKED_SYMBOLS.length);
  });
});
