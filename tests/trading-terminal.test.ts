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

describe("TradingTerminal — chart dimensions are unaffected by Open Orders/History", () => {
  // Regression coverage: the chart wrapper must stay a plain
  // min-h-0/flex-1 flex item (i.e. "take exactly what's left after
  // fixed-size siblings"), never an elastic floor or anything else that
  // would make its size depend on how many order rows exist. Open
  // Orders/History now lives entirely OUTSIDE the top workspace row (see
  // the OrdersWorkspace describe block below) — it can't compete with
  // the chart for space even in principle, since it's no longer even a
  // descendant of the column the chart sits in.
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

  it("the center column (topbar + chart) has a scroll fallback, not a hard clip", () => {
    renderTerminal();
    const centerColumn = chartWrapperEl().parentElement as HTMLElement;
    expect(centerColumn.className).toContain("overflow-y-auto");
  });

  it("the top workspace row clips, and its height is the viewport minus the navbar minus exactly what Open Orders/History used to occupy inside it — the same budget as before, so the chart's own flex-1 pixel height is unchanged", () => {
    renderTerminal();
    const centerColumn = chartWrapperEl().parentElement as HTMLElement;
    const row = centerColumn.parentElement as HTMLElement;
    expect(row.className).toContain("overflow-hidden");
    expect(row.className).toContain("shrink-0");
    expect(row.className).toMatch(/h-\[calc\(100vh-4rem-13rem\)\]/);
  });
});

describe("TradingTerminal — OrdersWorkspace: Open Orders/History as a full-width row below the top workspace", () => {
  function ordersPanelRoot(): HTMLElement {
    const ordersHeading = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith("Open orders")
    )!;
    expect(ordersHeading, "expected to find the Open orders tab button").toBeTruthy();
    return ordersHeading.parentElement!.parentElement as HTMLElement;
  }

  function topWorkspaceRow(): HTMLElement {
    const chartRoot = container.querySelector<HTMLElement>(".relative.h-full.w-full")!;
    // chartRoot -> chart wrapper (min-h-0/flex-1) -> center column
    // (overflow-y-auto) -> the row itself.
    return chartRoot.parentElement!.parentElement!.parentElement as HTMLElement;
  }

  it("exactly one Open Orders/History instance exists — never duplicated", () => {
    renderTerminal();
    const matches = Array.from(container.querySelectorAll("button")).filter((b) =>
      b.textContent?.startsWith("Open orders")
    );
    expect(matches).toHaveLength(1);
  });

  it("renders at its natural height — no internal fixed-height scrollbox — so the page scrolls instead of a cramped inner one", () => {
    renderTerminal();
    const root = ordersPanelRoot();
    expect(root.className).not.toMatch(/\bh-52\b/);
    expect(root.className).not.toContain("overflow-y-auto");
  });

  it("is a SIBLING of the top workspace row, not nested inside it (so it isn't constrained to the chart column's width)", () => {
    renderTerminal();
    const row = topWorkspaceRow();
    const orders = ordersPanelRoot();
    expect(row.contains(orders)).toBe(false);
    expect(orders.parentElement).toBe(row.parentElement);
  });

  it("shares the same left/right edges as the top workspace (same parent, block-level full width — spans market sidebar + chart + Spot panel combined)", () => {
    renderTerminal();
    const row = topWorkspaceRow();
    const orders = ordersPanelRoot();
    expect(orders.parentElement).toBe(row.parentElement);
    // A block-level sibling with no width/margin constraint of its own
    // naturally spans the same content width as `row` (a flex item that
    // already fills that same parent) — asserting the shared parent (and
    // that `orders` carries no independent width-limiting class) is the
    // meaningful, resolution-independent check in jsdom (no real layout
    // engine to read computed pixel widths from).
    expect(orders.className).not.toMatch(/\bw-(\d+|px|screen|\[.*\])\b/);
  });

  it("comes AFTER the top workspace in document order (below it, not above)", () => {
    renderTerminal();
    const row = topWorkspaceRow();
    const orders = ordersPanelRoot();
    expect(
      row.compareDocumentPosition(orders) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("keeps its existing top border as the seam between the two workspaces", () => {
    renderTerminal();
    expect(ordersPanelRoot().className).toContain("border-t");
  });
});

describe("TradingTerminal — MarketTicker: actually mounted, after OrdersWorkspace, wired to pair selection", () => {
  it("is genuinely rendered (not just imported) — real pair symbols appear in the DOM", () => {
    renderTerminal();
    expect(container.textContent).toContain("ETH/USDT");
    expect(container.textContent).toContain("BNB/USDT");
  });

  it("comes after OrdersWorkspace in document order (bottom of the page)", () => {
    renderTerminal();
    const ordersHeading = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.startsWith("Open orders")
    )!;
    const ordersRoot = ordersHeading.parentElement!.parentElement as HTMLElement;
    const tickerButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("ETH/USDT")
    )!;
    expect(
      ordersRoot.compareDocumentPosition(tickerButton) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("clicking a ticker pair selects it in the chart — same pair-selection mechanism as the sidebar", () => {
    renderTerminal();
    const h2Texts = () =>
      Array.from(container.querySelectorAll("h2")).map((h) => h.textContent);
    expect(h2Texts()).toContain("BTC/USDT");

    const ethTickerButton = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("ETH/USDT")
    )!;
    act(() => {
      ethTickerButton.click();
    });

    expect(h2Texts()).toContain("ETH/USDT");
  });

  it("reserves bottom padding matching the ticker's own height, so the fixed ticker never permanently covers the last Order History row", () => {
    renderTerminal();
    // MarketTicker is `fixed` (removed from flow) — the page root must
    // carry its own compensating padding-bottom, since nothing else
    // pushes content up out from under it.
    const pageRoot = container.firstElementChild as HTMLElement;
    expect(pageRoot.className).toContain("pb-8");
  });
});
