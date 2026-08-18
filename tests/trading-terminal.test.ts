// @vitest-environment jsdom
/**
 * Proves Trading is now Spot-only: no Spot/Futures toggle, no leverage/
 * margin/liquidation UI, no Futures Balance/Credit/Equity/Profit — and
 * that Spot's own Market/Limit defaults (Market first, selected by
 * default) still hold.
 *
 * `lightweight-charts` is mocked (needs a real <canvas>) the same way
 * tests/chart-race-condition.test.ts already mocks it — the point here
 * is Trading's UI composition, not the chart itself. The chart's own
 * kline fetch is left permanently pending via a stubbed `fetch` that
 * never resolves; nothing in these assertions depends on it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TradingTerminal } from "@/components/trading/trading-terminal";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

vi.mock("@/hooks/use-api", () => ({
  useAccountSummary: () => ({
    data: { balance: 0, equity: 0, profit: 0, spotAssets: [] },
    isLoading: false,
  }),
  useSpotWallet: () => ({ data: [], isLoading: false }),
  useCreateSpotOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSpotOrders: () => ({ data: [], isLoading: false }),
  useCancelSpotOrder: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("lightweight-charts", () => ({
  ColorType: { Solid: "solid" },
  createChart: () => ({
    addCandlestickSeries: () => ({
      setData: () => {},
      update: () => {},
      priceScale: () => ({ applyOptions: () => {} }),
    }),
    addHistogramSeries: () => ({
      setData: () => {},
      update: () => {},
      priceScale: () => ({ applyOptions: () => {} }),
    }),
    timeScale: () => ({
      subscribeVisibleLogicalRangeChange: () => {},
      unsubscribeVisibleLogicalRangeChange: () => {},
      fitContent: () => {},
      applyOptions: () => {},
    }),
    applyOptions: () => {},
    resize: () => {},
    remove: () => {},
    subscribeCrosshairMove: () => {},
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {}))
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function renderTerminal() {
  act(() => {
    root.render(React.createElement(TradingTerminal));
  });
}

describe("TradingTerminal — Spot-only", () => {
  it("shows the Spot order panel, with no Spot/Futures toggle at all", () => {
    renderTerminal();
    expect(container.textContent).toContain("Spot trade");
    // No toggle buttons literally labelled "Spot"/"Futures" (the old
    // TradeModeToggle) exist anywhere in the tree.
    const buttonTexts = Array.from(container.querySelectorAll("button")).map((b) =>
      b.textContent?.trim()
    );
    expect(buttonTexts).not.toContain("Futures");
  });

  it("never renders Futures/leverage/margin/liquidation UI", () => {
    renderTerminal();
    expect(container.textContent).not.toContain("Open trades"); // OpenPositionsPanel's tab
    expect(container.textContent).not.toContain("Leverage");
    expect(container.textContent).not.toContain("Take Profit");
    expect(container.textContent).not.toContain("Stop Loss");
    expect(container.textContent).not.toContain("Liquidation");
  });

  it("has no way to switch to Futures (no such control exists)", () => {
    renderTerminal();
    const hasFuturesButton = Array.from(container.querySelectorAll("button")).some(
      (b) => b.textContent?.trim() === "Futures"
    );
    expect(hasFuturesButton).toBe(false);
  });

  it("within Spot, Market is selected by default (the Limit price input is not shown)", () => {
    renderTerminal();
    expect(container.textContent).not.toContain("Price (USDT)");
  });

  it("renders the Market tab before the Limit tab", () => {
    renderTerminal();
    const html = container.innerHTML;
    const marketIndex = html.indexOf(">Market<");
    const limitIndex = html.indexOf(">Limit<");
    expect(marketIndex).toBeGreaterThan(-1);
    expect(marketIndex).toBeLessThan(limitIndex);
  });

  it("switching to Limit still works (Spot's own manual override is not broken)", () => {
    renderTerminal();
    const limitButton = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Limit"
    );
    act(() => {
      limitButton!.click();
    });
    expect(container.textContent).toContain("Price (USDT)");
  });

  it("the header shows Balance/Equity/Profit, with no Credit anywhere", () => {
    renderTerminal();
    expect(container.textContent).toContain("Balance");
    expect(container.textContent).toContain("Equity");
    expect(container.textContent).toContain("Profit");
    expect(container.textContent).not.toContain("Credit");
  });
});
