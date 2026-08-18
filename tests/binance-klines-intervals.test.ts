// @vitest-environment node
/**
 * Covers the timeframe-selector fix's data-layer half:
 * lib/binance/client.ts's KLINE_INTERVALS list (the exact 8 intervals
 * the /trading timeframe dropdown now offers) and fetchKlines's handling
 * of the two synthetic ones — "5s" and "30s" don't exist as native
 * Binance kline intervals, so both are built by aggregating Binance's
 * real "1s" candles (5 or 30 at a time). This is the same aggregation
 * mechanism "30s" already used before this change — "5s" is not a new,
 * second mechanism.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { KLINE_INTERVALS, fetchKlines } from "@/lib/binance/client";

function binanceRow(openTimeMs: number, close: number) {
  return [
    openTimeMs,
    String(close), // open
    String(close), // high
    String(close), // low
    String(close), // close
    "1", // volume
  ];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("KLINE_INTERVALS — exactly the 8 timeframes the dropdown offers", () => {
  it("matches the required list, in order", () => {
    expect(KLINE_INTERVALS).toEqual(["5s", "30s", "1m", "15m", "1h", "4h", "1d", "1w"]);
  });

  it("no longer includes the removed 3m/5m/30m intervals", () => {
    expect(KLINE_INTERVALS).not.toContain("3m");
    expect(KLINE_INTERVALS).not.toContain("5m");
    expect(KLINE_INTERVALS).not.toContain("30m");
  });
});

describe("fetchKlines — synthetic 5s interval (same mechanism as 30s)", () => {
  it("requests native 1s candles from Binance and aggregates 5 at a time", async () => {
    const rows = Array.from({ length: 25 }, (_, i) => binanceRow(i * 1000, 100 + i));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rows,
    });
    vi.stubGlobal("fetch", fetchMock);

    const candles = await fetchKlines("BTCUSDT", "5s", 5);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("interval=1s");

    // 25 one-second candles bucket into 5 five-second candles.
    expect(candles.length).toBe(5);
    expect(candles[0]!.time).toBe(0);
    expect(candles[1]!.time).toBe(5);
  });
});

describe("fetchKlines — synthetic 30s interval keeps working (unchanged behavior)", () => {
  it("requests native 1s candles and aggregates 30 at a time", async () => {
    const rows = Array.from({ length: 30 }, (_, i) => binanceRow(i * 1000, 100 + i));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rows,
    });
    vi.stubGlobal("fetch", fetchMock);

    const candles = await fetchKlines("BTCUSDT", "30s", 1);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("interval=1s");
    expect(candles.length).toBe(1);
  });
});

describe("fetchKlines — native intervals pass straight through, unaggregated", () => {
  it("requests the native Binance interval directly for 1h", async () => {
    const rows = [binanceRow(0, 100)];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => rows,
    });
    vi.stubGlobal("fetch", fetchMock);

    const candles = await fetchKlines("BTCUSDT", "1h", 500);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("interval=1h");
    expect(candles.length).toBe(1);
  });

  it.each(["1m", "15m", "1h", "4h", "1d", "1w"] as const)(
    "maps %s straight to the same native Binance interval string",
    async (interval) => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
      vi.stubGlobal("fetch", fetchMock);
      await fetchKlines("BTCUSDT", interval, 10);
      const [url] = fetchMock.mock.calls[0] as [string];
      expect(url).toContain(`interval=${interval}`);
    }
  );
});
