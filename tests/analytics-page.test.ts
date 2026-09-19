// @vitest-environment jsdom
/**
 * /analytics — async Server Component (same reasoning as
 * tests/homepage.test.ts). Replaces the old standalone News feature:
 * every price/change/volume figure is derived from GTX's own existing
 * market-data stack (useMarkets + useLivePrices, mocked here the same
 * way tests/homepage.test.ts already does), never fabricated. Footer is
 * pre-existing/untouched, so it's stubbed rather than retested.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import { translate } from "@/lib/i18n/dictionaries";
import AnalyticsPage, { generateMetadata } from "@/app/(marketing)/analytics/page";
import type { NewsFetchResult } from "@/lib/news/fetch";
import type { NewsArticle } from "@/lib/news/types";
import type { MarketAsset } from "@/hooks/use-api";
import type { Candle } from "@/lib/binance/client";

const LOCALE = "uk" as const;
let mockFetchResult: NewsFetchResult = { articles: [], sources: [] };
let mockMarkets: { data: MarketAsset[]; isLoading: boolean } = {
  data: [],
  isLoading: false,
};
let mockUser: { firstName: string; lastName: string; email: string } | null = null;

const { useKlinesMock } = vi.hoisted(() => ({ useKlinesMock: vi.fn() }));

vi.mock("@/lib/auth/session", () => ({
  getOptionalUser: () => Promise.resolve(mockUser),
}));

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) => translate(LOCALE, key)),
  getServerLocale: () => Promise.resolve(LOCALE),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/analytics",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

vi.mock("@/hooks/use-api", () => ({
  useMarkets: () => mockMarkets,
  useKlines: (symbol: string) => useKlinesMock(symbol),
}));

vi.mock("@/lib/news/fetch", () => ({
  fetchAllNews: () => Promise.resolve(mockFetchResult),
}));

vi.mock("@/components/marketing/footer", () => ({
  Footer: () => React.createElement("footer", { "data-testid": "footer" }),
}));

// Needs a real <canvas> (getContext) — mocked the same way
// tests/trading-terminal.test.ts already mocks it for the Trading chart;
// only addAreaSeries is used here instead of candlestick/histogram.
vi.mock("lightweight-charts", () => ({
  ColorType: { Solid: "solid" },
  createChart: () => ({
    addAreaSeries: () => ({
      setData: () => {},
      applyOptions: () => {},
    }),
    timeScale: () => ({ fitContent: () => {} }),
    applyOptions: () => {},
    remove: () => {},
    subscribeCrosshairMove: () => {},
    unsubscribeCrosshairMove: () => {},
  }),
}));

function klines(count = 24, basePrice = 100): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  return Array.from({ length: count }, (_, i) => ({
    time: now - (count - i) * 3600,
    open: basePrice,
    high: basePrice,
    low: basePrice,
    close: basePrice + i,
    volume: 10,
  }));
}

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

function marketAsset(overrides: Partial<MarketAsset> = {}): MarketAsset {
  return {
    id: overrides.symbol ?? "btc",
    symbol: "BTCUSDT",
    displaySymbol: "BTC/USDT",
    category: "major",
    price: 65000,
    change24h: 2.5,
    ...overrides,
  };
}

function article(overrides: Partial<NewsArticle> = {}): NewsArticle {
  const title = overrides.title ?? "Bitcoin surges past resistance";
  return {
    id: overrides.url ?? "https://example.com/story",
    title,
    description: "Bitcoin broke through a key level today.",
    url: "https://example.com/bitcoin-story",
    image: "https://cdn.example.com/img.jpg",
    source: "CoinDesk",
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

let container: HTMLDivElement;
let root: Root;
let queryClient: QueryClient;

beforeEach(() => {
  // MarketCarousel (rendered twice per page — gainers + losers) runs a
  // real setInterval/setTimeout for its slow auto-advance/resume-after-
  // interaction behavior. Without faking timers here, every mount across
  // this file's ~20 tests leaves its interval ticking in the background
  // for the rest of the run (root.unmount() below clears it correctly at
  // unmount time, but only once React actually gets to flush that
  // cleanup — in the meantime, and any time that flush is delayed,
  // outstanding real timers pile up test over test, each one firing
  // asynchronously and producing "not wrapped in act(...)" warnings, and
  // together burning enough real CPU across the file to make it take
  // minutes instead of seconds). Nothing in this file awaits a real
  // delay, so faking timers changes no test's behavior.
  vi.useFakeTimers();
  mockFetchResult = { articles: [], sources: [] };
  mockMarkets = { data: [], isLoading: false };
  mockUser = null;
  useKlinesMock.mockReset();
  useKlinesMock.mockImplementation(() => ({
    data: klines(),
    isLoading: false,
    isError: false,
  }));
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

async function renderPage() {
  const element = await AnalyticsPage();
  act(() => {
    root.render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          LocaleProvider,
          { initialLocale: LOCALE },
          React.createElement(ThemeProvider, { initialTheme: "dark" }, element)
        )
      )
    );
  });
}

describe("Analytics page — renders", () => {
  it("shows the title/subtitle and the existing Footer once", async () => {
    await renderPage();
    expect(container.textContent).toContain(t("analytics.title"));
    expect(container.textContent).toContain(t("analytics.subtitle"));
    expect(container.querySelectorAll("footer").length).toBe(1);
  });

  it("SEO metadata is analytics-specific, not the old News copy", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(t("analytics.seo.title"));
    expect(metadata.description).toBe(t("analytics.seo.description"));
  });
});

describe("Analytics page — Обзор рынка (gainers/losers carousels, real data only)", () => {
  it("shows the section heading and both carousel labels", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT", change24h: 12.8 }),
        marketAsset({ symbol: "ETHUSDT", change24h: -9.1 }),
      ],
      isLoading: false,
    };
    await renderPage();
    expect(container.textContent).toContain(t("analytics.marketOverview.title"));
    expect(container.textContent).toContain(
      t("analytics.marketOverview.gainersCarousel")
    );
    expect(container.textContent).toContain(t("analytics.marketOverview.losersCarousel"));
  });

  it("filters to only real gainers/losers (never a top-N regardless of sign) and shows real price/%/volume", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT", price: 71000, change24h: 12.8 }),
        marketAsset({ symbol: "ETHUSDT", price: 3500, change24h: -9.1 }),
        marketAsset({ symbol: "SOLUSDT", price: 150, change24h: 0 }), // flat -> neither list
      ],
      isLoading: false,
    };
    await renderPage();
    expect(container.textContent).toContain("+12.80%");
    expect(container.textContent).toContain("-9.10%");

    // SOL (flat 0% change) legitimately still appears elsewhere on the
    // page (Highest Activity, Market Table show every tracked row) — the
    // real assertion is that it's excluded specifically from the
    // gainers/losers carousel cards, not from the whole page.
    const carouselSymbols = Array.from(
      container.querySelectorAll("a[data-carousel-card]")
    ).map((el) => el.textContent ?? "");
    expect(carouselSymbols.some((t) => t.includes("BTC/USDT"))).toBe(true);
    expect(carouselSymbols.some((t) => t.includes("ETH/USDT"))).toBe(true);
    expect(carouselSymbols.some((t) => t.includes("SOL/USDT"))).toBe(false);
  });

  it("card click routes to the existing trading route, preserving /login redirect for a guest", async () => {
    mockUser = null;
    mockMarkets = {
      data: [marketAsset({ symbol: "BTCUSDT", change24h: 5 })],
      isLoading: false,
    };
    await renderPage();
    const link = container.querySelector('a[href^="/login?redirect="]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toContain(
      encodeURIComponent("/trading?symbol=BTCUSDT")
    );
  });

  it("routes an authenticated user straight to /trading", async () => {
    mockUser = { firstName: "Jane", lastName: "Doe", email: "jane@example.com" };
    mockMarkets = {
      data: [marketAsset({ symbol: "BTCUSDT", change24h: 5 })],
      isLoading: false,
    };
    await renderPage();
    expect(container.querySelector('a[href="/trading?symbol=BTCUSDT"]')).not.toBeNull();
  });

  it("removes the old Активов/Растут/Падают/Состояние рынка/Популярные активы blocks", async () => {
    mockMarkets = {
      data: [marketAsset({ symbol: "BTCUSDT", change24h: 5 })],
      isLoading: false,
    };
    await renderPage();
    expect(container.textContent).not.toContain("Состояние рынка");
    expect(container.textContent).not.toContain("Популярные активы");
    expect(container.textContent).not.toContain("Рынок сегодня");
  });

  it("has no carousel arrow buttons", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT", change24h: 12.8 }),
        marketAsset({ symbol: "ETHUSDT", change24h: -9.1 }),
      ],
      isLoading: false,
    };
    await renderPage();
    // Scoped to each carousel's own wrapper (not the whole page, which
    // also has the Navbar hamburger and the Market Table's filter
    // buttons) — no left/right controls inside either carousel.
    for (const label of [
      t("analytics.marketOverview.gainersCarousel"),
      t("analytics.marketOverview.losersCarousel"),
    ]) {
      const heading = Array.from(container.querySelectorAll("h3")).find(
        (h) => h.textContent === label
      );
      expect(heading).toBeDefined();
      expect(heading!.parentElement!.querySelectorAll("button")).toHaveLength(0);
    }
  });

  it("every card uses full-card responsive widths, never the old partial-peek sizing", async () => {
    mockMarkets = {
      data: [marketAsset({ symbol: "BTCUSDT", change24h: 5 })],
      isLoading: false,
    };
    await renderPage();
    const card = container.querySelector("a[data-carousel-card]");
    expect(card).not.toBeNull();
    expect(card!.className).not.toContain("w-[82%]");
    expect(card!.className).toContain("w-full");
    expect(card!.className).toContain("snap-start");
  });
});

describe("Analytics page — Динамика рынка (searchable market selector + real 24h chart)", () => {
  function findDynamicsSection(label: string): HTMLElement {
    const heading = Array.from(container.querySelectorAll("h2")).find(
      (h) => h.textContent === label
    );
    expect(heading).toBeDefined();
    const section = heading!.closest("section");
    expect(section).not.toBeNull();
    return section as HTMLElement;
  }

  it("defaults to BTC/USDT and shows its real price/24h% from the shared dataset", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT", price: 71234.5, change24h: 3.2 }),
        marketAsset({ symbol: "ETHUSDT", price: 3500, change24h: -1.1 }),
      ],
      isLoading: false,
    };
    await renderPage();
    const section = findDynamicsSection(t("analytics.dynamics.title"));
    expect(section.textContent).toContain("BTC/USDT");
    expect(section.textContent).toContain("71,234.50");
    expect(section.textContent).toContain("+3.20%");
    expect(useKlinesMock).toHaveBeenCalledWith("BTCUSDT");
  });

  it("builds the selector from the existing MARKET_REGISTRY, not a separate hardcoded list", async () => {
    mockMarkets = { data: [marketAsset({ symbol: "BTCUSDT" })], isLoading: false };
    await renderPage();
    const section = findDynamicsSection(t("analytics.dynamics.title"));
    const trigger = Array.from(section.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("BTC/USDT")
    )!;
    act(() => trigger.click());

    // A handful of real registry entries should be present in the list.
    for (const pair of ["ETH/USDT", "SOL/USDT", "XRP/USDT", "DOGE/USDT"]) {
      expect(section.textContent).toContain(pair);
    }
  });

  it("search filters the list by symbol/pair", async () => {
    mockMarkets = { data: [marketAsset({ symbol: "BTCUSDT" })], isLoading: false };
    await renderPage();
    const section = findDynamicsSection(t("analytics.dynamics.title"));
    const trigger = Array.from(section.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("BTC/USDT")
    )!;
    act(() => trigger.click());

    const search = section.querySelector(
      `input[placeholder="${t("analytics.dynamics.searchPlaceholder")}"]`
    ) as HTMLInputElement;
    expect(search).not.toBeNull();

    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )!.set!;
      setter.call(search, "eth");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(section.textContent).toContain("ETH/USDT");
    expect(section.textContent).not.toContain("SOL/USDT");
    expect(section.textContent).not.toContain("XRP/USDT");
  });

  it("selecting another pair updates price/24h% and requests that pair's own real history, with no stale BTC data left", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT", price: 71234.5, change24h: 3.2 }),
        marketAsset({ symbol: "ETHUSDT", price: 3500, change24h: -1.1 }),
      ],
      isLoading: false,
    };
    await renderPage();
    const section = findDynamicsSection(t("analytics.dynamics.title"));
    const trigger = Array.from(section.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("BTC/USDT")
    )!;
    act(() => trigger.click());

    const ethOption = Array.from(section.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "ETH/USDT"
    )!;
    act(() => ethOption.click());

    expect(section.textContent).toContain("ETH/USDT");
    expect(section.textContent).toContain("3,500.00");
    expect(section.textContent).toContain("-1.10%");
    expect(section.textContent).not.toContain("71,234.50");
    expect(section.textContent).not.toContain("+3.20%");
    expect(useKlinesMock).toHaveBeenLastCalledWith("ETHUSDT");
  });

  it("shows a chart-scoped error message on failure without breaking the rest of the page", async () => {
    useKlinesMock.mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      isError: true,
    }));
    mockMarkets = { data: [marketAsset({ symbol: "BTCUSDT" })], isLoading: false };
    await renderPage();
    expect(container.textContent).toContain(t("analytics.dynamics.error"));
    // The rest of the page still rendered fine.
    expect(container.textContent).toContain(t("analytics.marketOverview.title"));
    expect(container.textContent).toContain(t("analytics.table.title"));
  });

  it("does not preload history for other markets — only the selected symbol is requested", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT" }),
        marketAsset({ symbol: "ETHUSDT" }),
        marketAsset({ symbol: "SOLUSDT" }),
      ],
      isLoading: false,
    };
    await renderPage();
    expect(useKlinesMock).toHaveBeenCalledTimes(1);
    expect(useKlinesMock).toHaveBeenCalledWith("BTCUSDT");
  });
});

describe("Analytics page — Market Table", () => {
  it("shows the search box, All/Gainers/Losers filters, and coin rows", async () => {
    mockMarkets = {
      data: [
        marketAsset({ symbol: "BTCUSDT", change24h: 4 }),
        marketAsset({ symbol: "ETHUSDT", change24h: -4 }),
      ],
      isLoading: false,
    };
    await renderPage();
    expect(container.textContent).toContain(t("analytics.table.title"));
    expect(
      container.querySelector(
        `input[placeholder="${t("analytics.table.searchPlaceholder")}"]`
      )
    ).not.toBeNull();
    expect(container.textContent).toContain(t("analytics.table.filterGainers"));
    expect(container.textContent).toContain(t("analytics.table.filterLosers"));
  });
});

describe("Analytics page — Market news (external links, no internal article page)", () => {
  it("shows up to 3 cards that link straight to the original publisher URL in a new tab", async () => {
    mockFetchResult = {
      articles: [
        article({ url: "https://example.com/a", title: "Story A" }),
        article({ url: "https://example.com/b", title: "Story B" }),
        article({ url: "https://example.com/c", title: "Story C" }),
        article({ url: "https://example.com/d", title: "Story D" }),
      ],
      sources: [],
    };
    await renderPage();
    expect(container.textContent).toContain(t("analytics.news.title"));

    const links = container.querySelectorAll('a[target="_blank"]');
    expect(links.length).toBe(3);
    for (const link of Array.from(links)) {
      expect(link.getAttribute("rel")).toContain("noopener");
      expect(link.getAttribute("rel")).toContain("noreferrer");
    }
    expect(container.textContent).not.toContain("Story D");

    // No internal /news/[slug] route exists anymore.
    expect(container.querySelector('a[href^="/news/"]')).toBeNull();
  });

  it("does not render the Market News section when the feeds return nothing", async () => {
    mockFetchResult = { articles: [], sources: [] };
    await renderPage();
    expect(container.textContent).not.toContain(t("analytics.news.title"));
  });
});
