/**
 * Unit tests for the pure Markets data-shaping helpers
 * (lib/markets/derive.ts) that back the redesigned /markets dashboard.
 * No DB, no network, no React — these are plain functions over plain
 * data, so they're tested directly rather than through component
 * rendering (this repo has no @testing-library/react and its component
 * tests, e.g. chart-race-condition.test.ts, mock the DOM extensively —
 * unnecessary here since none of this logic touches the DOM).
 */
import { describe, expect, it } from "vitest";
import {
  baseAssetOf,
  closesFromCandles,
  filterBySearch,
  getBiggestMovers,
  getPopular,
  getTopGainers,
  getTopLosers,
  getTopVolume,
  mergeMarketData,
  sortRows,
  type EnrichedMarket,
  type MarketAssetLike,
} from "@/lib/markets/derive";

const ASSETS: MarketAssetLike[] = [
  { id: "1", symbol: "BTCUSDT", displaySymbol: "BTC/USD", price: 60000, change24h: 1.5 },
  { id: "2", symbol: "ETHUSDT", displaySymbol: "ETH/USD", price: 3000, change24h: -2.5 },
  { id: "3", symbol: "SOLUSDT", displaySymbol: "SOL/USD", price: 150, change24h: 10 },
  { id: "4", symbol: "DOGEUSDT", displaySymbol: "DOGE/USD", price: 0.15, change24h: -8 },
];

describe("baseAssetOf", () => {
  it("strips the USDT quote suffix", () => {
    expect(baseAssetOf("BTCUSDT")).toBe("BTC");
    expect(baseAssetOf("DOGEUSDT")).toBe("DOGE");
  });
});

describe("mergeMarketData", () => {
  it("overlays live ticker fields over the REST snapshot when present", () => {
    const merged = mergeMarketData(ASSETS, {
      BTCUSDT: { price: 61000, changePercent24h: 2.1, volume24h: 1234.5 },
    });
    const btc = merged.find((r) => r.symbol === "BTCUSDT")!;
    expect(btc.price).toBe(61000);
    expect(btc.change24h).toBe(2.1);
    expect(btc.volume24h).toBe(1234.5);
    expect(btc.base).toBe("BTC");
    expect(btc.name).toBe("Bitcoin");
  });

  it("falls back to the REST snapshot and null volume when no live tick has arrived", () => {
    const merged = mergeMarketData(ASSETS, {});
    const eth = merged.find((r) => r.symbol === "ETHUSDT")!;
    expect(eth.price).toBe(3000);
    expect(eth.change24h).toBe(-2.5);
    expect(eth.volume24h).toBeNull();
  });

  it("falls back to the base ticker as the name when it has no friendly label", () => {
    const merged = mergeMarketData(
      [{ id: "9", symbol: "FOOUSDT", displaySymbol: "FOO/USD", price: 1, change24h: 0 }],
      {}
    );
    expect(merged[0]!.name).toBe("FOO");
  });
});

describe("filterBySearch", () => {
  const rows = mergeMarketData(ASSETS, {});

  it("matches by friendly name, case-insensitively", () => {
    expect(filterBySearch(rows, "bitcoin").map((r) => r.symbol)).toEqual(["BTCUSDT"]);
  });

  it("matches by base ticker", () => {
    expect(filterBySearch(rows, "eth").map((r) => r.symbol)).toEqual(["ETHUSDT"]);
  });

  it("matches by full pair symbol", () => {
    expect(filterBySearch(rows, "SOLUSDT").map((r) => r.symbol)).toEqual(["SOLUSDT"]);
  });

  it("matches by display symbol", () => {
    expect(filterBySearch(rows, "doge/usd").map((r) => r.symbol)).toEqual(["DOGEUSDT"]);
  });

  it("returns every row for an empty/whitespace query", () => {
    expect(filterBySearch(rows, "   ")).toHaveLength(rows.length);
  });

  it("returns no rows when nothing matches", () => {
    expect(filterBySearch(rows, "nonexistent-coin")).toHaveLength(0);
  });

  it("searches only within whatever subset it's given — e.g. a favorites list", () => {
    // The "Избранные" tab passes its already-favorited subset into the
    // same filterBySearch used by "Все криптовалюты" — no separate
    // search codepath, so searching for something outside the subset
    // finds nothing even if it exists in the full list.
    const favoritesOnly = rows.filter((r) => r.symbol === "ETHUSDT");
    expect(filterBySearch(favoritesOnly, "bitcoin")).toHaveLength(0);
    expect(filterBySearch(favoritesOnly, "eth")).toHaveLength(1);
  });
});

describe("sortRows", () => {
  const rows = mergeMarketData(ASSETS, {});

  it("sorts numerically ascending and descending", () => {
    expect(sortRows(rows, "price", "asc").map((r) => r.symbol)).toEqual([
      "DOGEUSDT",
      "SOLUSDT",
      "ETHUSDT",
      "BTCUSDT",
    ]);
    expect(sortRows(rows, "price", "desc").map((r) => r.symbol)).toEqual([
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "DOGEUSDT",
    ]);
  });

  it("sorts by name alphabetically", () => {
    // Bitcoin, Cardano(n/a here), Dogecoin, Ethereum, Solana
    expect(sortRows(rows, "name", "asc").map((r) => r.name)).toEqual([
      "Bitcoin",
      "Dogecoin",
      "Ethereum",
      "Solana",
    ]);
  });

  it("always sorts rows with a null field to the bottom, in both directions", () => {
    const withGap: EnrichedMarket[] = mergeMarketData(ASSETS, {
      BTCUSDT: { price: 61000, changePercent24h: 2.1, volume24h: 500 },
    });
    const asc = sortRows(withGap, "volume24h", "asc");
    const desc = sortRows(withGap, "volume24h", "desc");
    expect(asc[asc.length - 1]!.volume24h).toBeNull();
    expect(desc[desc.length - 1]!.volume24h).toBeNull();
  });
});

describe("getPopular", () => {
  it("orders rows by the given tracked-symbol order, dropping unknown symbols", () => {
    const rows = mergeMarketData(ASSETS, {});
    const order = ["SOLUSDT", "BTCUSDT", "NOPEUSDT", "ETHUSDT"];
    expect(getPopular(rows, order).map((r) => r.symbol)).toEqual([
      "SOLUSDT",
      "BTCUSDT",
      "ETHUSDT",
    ]);
  });
});

describe("getTopGainers / getTopLosers", () => {
  const rows = mergeMarketData(ASSETS, {});

  it("ranks gainers by 24h change, descending", () => {
    expect(getTopGainers(rows).map((r) => r.symbol)).toEqual([
      "SOLUSDT",
      "BTCUSDT",
      "ETHUSDT",
      "DOGEUSDT",
    ]);
  });

  it("ranks losers by 24h change, ascending", () => {
    expect(getTopLosers(rows).map((r) => r.symbol)).toEqual([
      "DOGEUSDT",
      "ETHUSDT",
      "BTCUSDT",
      "SOLUSDT",
    ]);
  });

  it("caps the result at n", () => {
    expect(getTopGainers(rows, 2)).toHaveLength(2);
  });
});

describe("getTopVolume", () => {
  it("ranks by real 24h volume, descending — replaces the old market-cap block", () => {
    const rows = mergeMarketData(ASSETS, {
      BTCUSDT: { price: 60000, changePercent24h: 1.5, volume24h: 500 },
      ETHUSDT: { price: 3000, changePercent24h: -2.5, volume24h: 9000 },
      SOLUSDT: { price: 150, changePercent24h: 10, volume24h: 100 },
      // DOGEUSDT deliberately left without a live tick -> volume24h stays null.
    });
    expect(getTopVolume(rows).map((r) => r.symbol)).toEqual([
      "ETHUSDT",
      "BTCUSDT",
      "SOLUSDT",
      "DOGEUSDT", // null volume always sorts last, never coerced to 0
    ]);
  });

  it("caps the result at n", () => {
    const rows = mergeMarketData(ASSETS, {});
    expect(getTopVolume(rows, 2)).toHaveLength(2);
  });
});

describe("closesFromCandles", () => {
  it("extracts the closing-price series a sparkline needs", () => {
    const candles = [{ close: 100 }, { close: 105 }, { close: 98 }];
    expect(closesFromCandles(candles)).toEqual([100, 105, 98]);
  });

  it("returns an empty array for no candles", () => {
    expect(closesFromCandles([])).toEqual([]);
  });
});

describe("getBiggestMovers", () => {
  it("ranks by absolute 24h change, descending, regardless of direction", () => {
    const rows = mergeMarketData(ASSETS, {});
    // |10| > |-8| > |-2.5| > |1.5|
    expect(getBiggestMovers(rows).map((r) => r.symbol)).toEqual([
      "SOLUSDT",
      "DOGEUSDT",
      "ETHUSDT",
      "BTCUSDT",
    ]);
  });
});

describe("scales to an expanded (~100-symbol) registry", () => {
  const MANY_ASSETS: MarketAssetLike[] = Array.from({ length: 100 }, (_, i) => ({
    id: String(i),
    symbol: `SYM${i}USDT`,
    displaySymbol: `SYM${i}/USD`,
    price: 1 + i,
    change24h: i % 2 === 0 ? i / 10 : -(i / 10),
  }));

  it("merges, searches, sorts and ranks correctly at 100 rows", () => {
    const rows = mergeMarketData(MANY_ASSETS, {});
    expect(rows).toHaveLength(100);

    expect(filterBySearch(rows, "SYM42").map((r) => r.symbol)).toEqual(["SYM42USDT"]);

    const sorted = sortRows(rows, "price", "desc");
    expect(sorted[0]!.symbol).toBe("SYM99USDT");
    expect(sorted).toHaveLength(100);

    expect(getTopGainers(rows, 10)).toHaveLength(10);
    expect(getTopLosers(rows, 10)).toHaveLength(10);
    expect(getBiggestMovers(rows, 10)).toHaveLength(10);
    expect(getTopVolume(rows, 10)).toHaveLength(10);
  });
});
