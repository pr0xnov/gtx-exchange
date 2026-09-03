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
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ThemeProvider } from "@/lib/theme/theme-context";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
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
  useWalletFinancials: () => ({
    availableBalance: 0,
    lockedInOrders: 0,
    assetsValue: 0,
    profitLoss: 0,
    isLoading: false,
  }),
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
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(
          ThemeProvider,
          { initialTheme: "dark" },
          React.createElement(TradingTerminal)
        )
      )
    );
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

  it("the header shows Available Balance/In Orders/Assets Value, with no Credit and no Profit/Loss summary", () => {
    renderTerminal();
    expect(container.textContent).toContain("Available Balance");
    expect(container.textContent).toContain("In Orders");
    expect(container.textContent).toContain("Assets Value");
    expect(container.textContent).not.toContain("Credit");
    // Trading isn't a P/L summary surface — the field was removed
    // entirely, not replaced with the weekly figure either.
    expect(container.textContent).not.toContain("Profit / Loss");
  });
});

describe("TradingTerminal — chart height is stable regardless of Open Orders row count/tab", () => {
  // Regression coverage: the chart wrapper must stay a plain
  // min-h-0/flex-1 flex item (i.e. "take exactly what's left after
  // fixed-size siblings"), never an elastic floor or anything else that
  // would make its size depend on how many order rows are below it.
  // Open Orders/History themselves must own a fixed height + their own
  // scroll (asserted in tests/spot-orders-panel.test.ts) so they never
  // compete with the chart for space in the first place.
  // CandlestickChart's own root (`<div className="relative h-full w-full">`,
  // see components/trading/candlestick-chart.tsx) is real, unmocked markup
  // — its parent is trading-terminal.tsx's chart wrapper. Locating it this
  // way (rather than by className substring) avoids false matches against
  // AssetWatchlist's own "min-h-0 flex-1 overflow-y-auto" list container
  // or SpotOrdersPanel's near-identical per-tab scroll boxes.
  function chartWrapperEl(): HTMLElement {
    const chartRoot = container.querySelector<HTMLElement>(".relative.h-full.w-full");
    expect(
      chartRoot,
      "expected to find CandlestickChart's own root element"
    ).toBeTruthy();
    return chartRoot!.parentElement as HTMLElement;
  }

  it("the chart's wrapper is min-h-0/flex-1 with no elastic floor tied to sibling content", () => {
    renderTerminal();
    const chartWrapper = chartWrapperEl();
    expect(chartWrapper.className).toContain("min-h-0");
    expect(chartWrapper.className).toContain("flex-1");
  });

  it("the center column (chart + Open Orders) has a scroll fallback, not a hard clip", () => {
    renderTerminal();
    const centerColumn = chartWrapperEl().parentElement as HTMLElement;
    expect(centerColumn.className).toContain("overflow-y-auto");
  });

  it("the row above the center column still clips (so the watchlist sidebar keeps its own fixed height/scroll)", () => {
    renderTerminal();
    const centerColumn = chartWrapperEl().parentElement as HTMLElement;
    const row = centerColumn.parentElement as HTMLElement;
    expect(row.className).toContain("overflow-hidden");
  });

  it("Open Orders carries its own fixed height, not an auto height competing with the chart", () => {
    renderTerminal();
    const ordersHeading = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith("Open orders")
    )!;
    // Panel root is the tab bar's parent.
    const panel = ordersHeading.parentElement!.parentElement as HTMLElement;
    expect(panel.className).toMatch(/\bh-52\b/);
  });
});
