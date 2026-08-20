// @vitest-environment jsdom
/**
 * Reproduces the zoom-out crash reported against commit 2dda514 and proves
 * the generation-guard fix in components/trading/candlestick-chart.tsx
 * closes it.
 *
 * Root cause: `loadOlderPage()` (triggered when the visible range nears the
 * left edge — i.e. when the user zooms out) captures symbol/timeframe and
 * fires an async fetch. If the user switches symbol/timeframe before that
 * fetch resolves, the stale continuation used to splice the *old* symbol's
 * older candles onto the *new* symbol's dataset and hand the result
 * straight to `series.setData()` — a non-ascending, mixed-symbol array,
 * which is exactly what lightweight-charts throws a hard assertion on.
 *
 * `lightweight-charts` itself is mocked (it needs a real <canvas>, and the
 * point here is to prove our own async orchestration is correct, not to
 * re-test the charting library). The mock's `setData` just records what it
 * was called with, so we can assert on it directly.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// The mock's setData just forwards whatever the component passed in.
// `open` only exists on "candles" calls (not "volume"), hence optional —
// it's the marker this test tags each symbol's candles with, read back in
// assertions below.
interface RecordedCall {
  kind: "candles" | "volume";
  data: Array<{ time: number; open?: number }>;
}

const hoisted = vi.hoisted(() => ({
  setDataCalls: [] as RecordedCall[],
  rangeChangeHandlers: [] as Array<(range: { from: number; to: number } | null) => void>,
}));

vi.mock("lightweight-charts", () => {
  function makeSeries(kind: "candles" | "volume") {
    return {
      setData: (data: Array<{ time: number }>) => {
        hoisted.setDataCalls.push({ kind, data });
      },
      update: () => {},
      applyOptions: () => {},
      priceScale: () => ({ applyOptions: () => {} }),
    };
  }

  return {
    ColorType: { Solid: "solid" },
    createChart: () => {
      const candleSeries = makeSeries("candles");
      const volumeSeries = makeSeries("volume");
      return {
        addCandlestickSeries: () => candleSeries,
        addHistogramSeries: () => volumeSeries,
        timeScale: () => ({
          subscribeVisibleLogicalRangeChange: (
            cb: (range: { from: number; to: number } | null) => void
          ) => {
            hoisted.rangeChangeHandlers.push(cb);
          },
          unsubscribeVisibleLogicalRangeChange: (
            cb: (range: { from: number; to: number } | null) => void
          ) => {
            hoisted.rangeChangeHandlers = hoisted.rangeChangeHandlers.filter(
              (h) => h !== cb
            );
          },
          fitContent: () => {},
          getVisibleLogicalRange: () => ({ from: 0, to: 500 }),
          setVisibleLogicalRange: () => {},
        }),
        applyOptions: () => {},
        remove: () => {},
      };
    },
  };
});

interface PendingRequest {
  url: string;
  resolve: (candles: unknown[]) => void;
}

let fetchQueue: PendingRequest[] = [];
let cacheBustCounter = 0;

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      return new Promise((resolve) => {
        fetchQueue.push({
          url,
          resolve: (candles: unknown[]) =>
            resolve({
              ok: true,
              json: async () => ({ success: true, data: candles }),
            } as Response),
        });
      });
    })
  );
}

function resolvePending(matcher: (url: string) => boolean, candles: unknown[]) {
  const idx = fetchQueue.findIndex((r) => matcher(r.url));
  if (idx === -1) {
    throw new Error(
      `No pending fetch matched. Queue: ${fetchQueue.map((r) => r.url).join(", ")}`
    );
  }
  const [req] = fetchQueue.splice(idx, 1);
  req!.resolve(candles);
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// CandlestickChart now reads its "Loading chart…" text through useLocale(),
// so every render needs a LocaleProvider ancestor. This has to be the SAME
// LocaleProvider — same underlying React.createContext() instance — that
// candlestick-chart.tsx itself resolves useLocale() against. Since these
// tests force a fresh module graph per scenario (vi.resetModules() +
// cache-busted dynamic import, right above), a LocaleProvider imported
// once at this file's top level would come from a *different* module
// generation than the one CandlestickChart's fresh copy pulls in
// internally — two distinct Context objects that can't see each other,
// so useLocale() would still throw "must be used within a LocaleProvider"
// despite a Provider visibly wrapping it in the tree. Re-importing
// LocaleProvider dynamically, after the same resetModules() call, lands
// it in the same fresh generation as CandlestickChart's own import.
async function chartElement(
  Component: React.ComponentType<{ symbol: string; timeframe: string }>,
  props: { symbol: string; timeframe: string }
) {
  const { LocaleProvider } = await import("@/lib/i18n/locale-context");
  const { ThemeProvider } = await import("@/lib/theme/theme-context");
  return React.createElement(
    LocaleProvider,
    { initialLocale: "en" },
    React.createElement(
      ThemeProvider,
      { initialTheme: "dark" },
      React.createElement(Component, props)
    )
  );
}

function makeCandles(count: number, startTime: number, marker: number) {
  return Array.from({ length: count }, (_, i) => ({
    time: startTime + i,
    open: marker,
    high: marker,
    low: marker,
    close: marker,
    volume: 1,
  }));
}

const CHART_PATH = path.resolve(__dirname, "../components/trading/candlestick-chart.tsx");
const FIXED_SOURCE = readFileSync(CHART_PATH, "utf8");
// The exact pre-fix content from the trading-terminal-upgrade commit —
// before the generation-guard was added.
const PRE_FIX_SOURCE = execSync(
  "git show 2dda514:components/trading/candlestick-chart.tsx",
  {
    cwd: path.resolve(__dirname, ".."),
    encoding: "utf8",
  }
);

describe("candlestick chart: stale pagination response race", () => {
  let container: HTMLDivElement;
  let root: Root;

  // Safety net: whatever happens above (including a failing assertion),
  // always leave the real source file back in its fixed state on disk.
  afterAll(() => {
    writeFileSync(CHART_PATH, FIXED_SOURCE);
  });

  beforeEach(() => {
    fetchQueue = [];
    hoisted.setDataCalls = [];
    hoisted.rangeChangeHandlers = [];
    installFetchMock();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  async function runRaceScenario() {
    // vi.resetModules() alone doesn't force Vite's transform pipeline to
    // re-read the file from disk between the PRE_FIX/FIXED writes below —
    // it was silently re-serving a cached transform of whichever version
    // was read first. A cache-busting query string forces a genuinely
    // fresh read + transform each time.
    const { CandlestickChart } = await import(
      /* @vite-ignore */ `../components/trading/candlestick-chart.tsx?cachebust${cacheBustCounter++}`
    );

    await act(async () => {
      root.render(
        await chartElement(CandlestickChart, { symbol: "AAAUSDT", timeframe: "1h" })
      );
      await flush();
    });

    // Initial page for AAAUSDT: times 100000..100499, tagged with marker 1.
    await act(async () => {
      resolvePending(
        (url) => url.includes("AAAUSDT") && !url.includes("endTime"),
        makeCandles(500, 100_000, 1)
      );
      await flush();
    });

    // Simulate the user zooming out until the visible range nears the left
    // edge of loaded data — this is what triggers loadOlderPage().
    await act(async () => {
      hoisted.rangeChangeHandlers[0]?.({ from: 5, to: 400 });
      await flush();
    });

    // That older-page request for AAAUSDT is now in flight but NOT yet
    // resolved. While it's pending, the user switches to a different pair.
    await act(async () => {
      root.render(
        await chartElement(CandlestickChart, { symbol: "BBBUSDT", timeframe: "1h" })
      );
      await flush();
    });

    // BBBUSDT's initial page lands: times 50000..50499, tagged marker 2 —
    // deliberately a disjoint, lower range than AAAUSDT's pending older
    // page, so any accidental merge is unambiguous (non-ascending).
    await act(async () => {
      resolvePending(
        (url) => url.includes("BBBUSDT") && !url.includes("endTime"),
        makeCandles(500, 50_000, 2)
      );
      await flush();
    });

    // NOW the stale AAAUSDT older-page request finally resolves.
    await act(async () => {
      resolvePending(
        (url) => url.includes("AAAUSDT") && url.includes("endTime"),
        makeCandles(500, 99_500, 1)
      );
      await flush();
    });
  }

  it("BEFORE the fix: the stale response is spliced in, producing a mixed-symbol, non-ascending array", async () => {
    writeFileSync(CHART_PATH, PRE_FIX_SOURCE);
    vi.resetModules();

    await runRaceScenario();

    const candleCalls = hoisted.setDataCalls.filter((c) => c.kind === "candles");
    // AAA initial, BBB initial, and — this is the bug — a THIRD call where
    // the stale AAA older-page response got merged onto BBB's data.
    expect(candleCalls.length).toBe(3);

    const corrupted = candleCalls[2]!.data;
    const times = corrupted.map((c) => c.time);
    const isAscending = times.every((t, i) => i === 0 || t > times[i - 1]!);
    expect(isAscending).toBe(false); // non-ascending: exactly what crashes lightweight-charts

    // And it's not just disordered — it's actually two different symbols'
    // data concatenated together.
    const hasMarker1 = corrupted.some((c) => c.open === 1);
    const hasMarker2 = corrupted.some((c) => c.open === 2);
    expect(hasMarker1 && hasMarker2).toBe(true);
  });

  it("AFTER the fix: the stale response is discarded before it ever reaches setData", async () => {
    writeFileSync(CHART_PATH, FIXED_SOURCE);
    vi.resetModules();

    await runRaceScenario();

    const candleCalls = hoisted.setDataCalls.filter((c) => c.kind === "candles");
    // Exactly two: AAA initial, then BBB initial. No third, corrupted call.
    expect(candleCalls.length).toBe(2);

    for (const call of candleCalls) {
      const times = call.data.map((c) => c.time);
      const isAscending = times.every((t, i) => i === 0 || t > times[i - 1]!);
      expect(isAscending).toBe(true);
    }

    // The last thing applied to the chart is BBBUSDT's own data only.
    const last = candleCalls[candleCalls.length - 1]!.data;
    expect(last.every((c) => c.open === 2)).toBe(true);
  });

  it("defense in depth: the ascending-order guard drops a corrupted batch even without a generation mismatch", async () => {
    // This isolates requirement 4 from the generation-guard fix above: even
    // if a batch were to reach applyData() out of order for some other
    // reason (a future regression, a malformed upstream response), the
    // guard in applyData() must catch it and drop it — never call
    // setData() with it, and never throw.
    writeFileSync(CHART_PATH, FIXED_SOURCE);
    vi.resetModules();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { CandlestickChart } = await import(
      /* @vite-ignore */ `../components/trading/candlestick-chart.tsx?cachebust${cacheBustCounter++}`
    );

    await act(async () => {
      root.render(
        await chartElement(CandlestickChart, { symbol: "AAAUSDT", timeframe: "1h" })
      );
      await flush();
    });
    await act(async () => {
      resolvePending(
        (url) => url.includes("AAAUSDT") && !url.includes("endTime"),
        makeCandles(500, 100_000, 1)
      );
      await flush();
    });

    // Zoom out -> triggers loadOlderPage for the SAME symbol (no switch,
    // no generation mismatch this time) — but the "older page" response
    // itself is internally out of order, as if the upstream data were
    // corrupt.
    await act(async () => {
      hoisted.rangeChangeHandlers[0]?.({ from: 5, to: 400 });
      await flush();
    });
    const brokenOlderPage = [
      { time: 99_999, open: 9, high: 9, low: 9, close: 9, volume: 1 },
      { time: 99_000, open: 9, high: 9, low: 9, close: 9, volume: 1 }, // out of order
      { time: 99_500, open: 9, high: 9, low: 9, close: 9, volume: 1 },
    ];
    await act(async () => {
      resolvePending(
        (url) => url.includes("AAAUSDT") && url.includes("endTime"),
        brokenOlderPage
      );
      await flush();
    });

    const candleCalls = hoisted.setDataCalls.filter((c) => c.kind === "candles");
    // Only the original clean initial load — the corrupted batch never
    // reached setData, and it was dropped quietly (a single short dev-only
    // warning, not a thrown error or a noisy object dump).
    expect(candleCalls.length).toBe(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});
