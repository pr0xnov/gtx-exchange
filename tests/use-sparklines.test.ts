// @vitest-environment jsdom
/**
 * Verifies useSparklines() (hooks/use-api.ts) never fires more than
 * SPARKLINE_BATCH_SIZE concurrent klines requests, even for the full
 * ~95-symbol registry — the concrete "100 requests at once" regression
 * this task's Step 8 explicitly calls out. Counts real fetch() calls
 * under fake timers rather than trusting the implementation by reading
 * it, the same way tests/chart-race-condition.test.ts verifies fetch
 * behavior for the chart.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSparklines } from "@/hooks/use-api";
import { MARKET_REGISTRY } from "@/lib/binance/client";

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;
let queryClient: QueryClient;

function makeCandles() {
  return [
    { time: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 },
    { time: 2, open: 1, high: 1, low: 1, close: 1.1, volume: 1 },
  ];
}

function Harness({ symbols }: { symbols: readonly string[] }) {
  useSparklines(symbols);
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock = vi.fn(
    () =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: makeCandles() }),
      }) as unknown as Promise<Response>
  );
  vi.stubGlobal("fetch", fetchMock);

  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function render(symbols: readonly string[]) {
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Harness, { symbols })
      )
    );
  });
}

describe("useSparklines — bounded concurrency", () => {
  it("fires at most 10 requests on first render, even for the full ~95-symbol registry", () => {
    render(MARKET_REGISTRY.map((e) => e.symbol));
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(10);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
  });

  it("reveals more symbols in later batches over time, never all at once", async () => {
    render(MARKET_REGISTRY.map((e) => e.symbol));
    const afterFirstBatch = fetchMock.mock.calls.length;
    expect(afterFirstBatch).toBeLessThanOrEqual(10);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    const afterSecondBatch = fetchMock.mock.calls.length;
    expect(afterSecondBatch).toBeGreaterThan(afterFirstBatch);
    expect(afterSecondBatch).toBeLessThanOrEqual(20);

    // Let every remaining batch land — total distinct requests should
    // reach the full registry size eventually, still never exceeding it.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    expect(fetchMock.mock.calls.length).toBe(MARKET_REGISTRY.length);
  });

  it("fires only as many requests as symbols given for a small list (unchanged behavior)", () => {
    render(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
    expect(fetchMock.mock.calls.length).toBe(3);
  });
});
