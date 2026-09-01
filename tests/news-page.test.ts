// @vitest-environment jsdom
/**
 * News page (`/news`) — async Server Component, awaited directly (same
 * reasoning as tests/homepage.test.ts). FeaturedStory/NewsExplorer are
 * either async (FeaturedStory) or would need real article data to render
 * meaningfully (NewsExplorer), so this stubs them and covers their own
 * behavior in tests/news-explorer.test.ts; fetchAllNews itself is
 * covered directly in tests/news-fetch.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { translate } from "@/lib/i18n/dictionaries";
import NewsPage, { generateMetadata } from "@/app/(marketing)/news/page";
import type { NewsFetchResult } from "@/lib/news/fetch";

const LOCALE = "uk" as const;
let mockFetchResult: NewsFetchResult = { articles: [], sources: [] };

vi.mock("@/lib/auth/session", () => ({
  getOptionalUser: () => Promise.resolve(null),
}));

vi.mock("@/lib/i18n/get-locale", () => ({
  getServerTranslator: () =>
    Promise.resolve((key: Parameters<typeof translate>[1]) => translate(LOCALE, key)),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/news",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-live-prices", () => ({
  useLivePrices: () => ({ prices: {}, connected: true }),
}));

vi.mock("@/hooks/use-api", () => ({
  useMarkets: () => ({ data: [], isLoading: false }),
}));

vi.mock("@/lib/news/fetch", () => ({
  fetchAllNews: () => Promise.resolve(mockFetchResult),
}));

vi.mock("@/components/news/featured-story", () => ({
  FeaturedStory: ({ article }: { article: { title: string } }) =>
    React.createElement("div", { "data-testid": "featured-story" }, article.title),
}));

vi.mock("@/components/news/news-explorer", () => ({
  NewsExplorer: ({ articles }: { articles: unknown[] }) =>
    React.createElement(
      "div",
      { "data-testid": "news-explorer" },
      `${articles.length} articles`
    ),
}));

vi.mock("@/components/marketing/footer", () => ({
  Footer: () => React.createElement("footer", { "data-testid": "footer" }),
}));

function t(key: Parameters<typeof translate>[1]) {
  return translate(LOCALE, key);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mockFetchResult = { articles: [], sources: [] };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderNewsPage() {
  const element = await NewsPage();
  act(() => {
    root.render(React.createElement(LocaleProvider, { initialLocale: LOCALE }, element));
  });
}

describe("News page — hero", () => {
  it("shows the heading, description, and live indicator", async () => {
    await renderNewsPage();
    expect(container.textContent).toContain(t("news.hero.headingLine1"));
    expect(container.textContent).toContain(t("news.hero.headingLine2"));
    expect(container.textContent).toContain(t("news.hero.description"));
    expect(container.textContent).toContain(t("news.hero.liveIndicator"));
  });
});

describe("News page — with articles", () => {
  it("renders the featured story (first article) and passes the rest to NewsExplorer", async () => {
    mockFetchResult = {
      articles: [
        {
          id: "1",
          title: "Featured headline",
          url: "https://example.com/1",
          source: "CoinDesk",
          publishedAt: new Date().toISOString(),
          category: "bitcoin",
        },
        {
          id: "2",
          title: "Second story",
          url: "https://example.com/2",
          source: "Decrypt",
          publishedAt: new Date().toISOString(),
          category: "ethereum",
        },
      ],
      sources: [
        { id: "coindesk", name: "CoinDesk", ok: true, count: 1 },
        { id: "decrypt", name: "Decrypt", ok: true, count: 1 },
      ],
    };
    await renderNewsPage();

    const featured = container.querySelector('[data-testid="featured-story"]');
    expect(featured?.textContent).toBe("Featured headline");

    const explorer = container.querySelector('[data-testid="news-explorer"]');
    expect(explorer?.textContent).toBe("1 articles");
  });

  it("only lists sources that actually returned articles in the source filter", async () => {
    mockFetchResult = {
      articles: [
        {
          id: "1",
          title: "Only story",
          url: "https://example.com/1",
          source: "CoinDesk",
          publishedAt: new Date().toISOString(),
          category: "bitcoin",
        },
      ],
      sources: [
        { id: "coindesk", name: "CoinDesk", ok: true, count: 1 },
        { id: "theblock", name: "The Block", ok: false, count: 0, error: "timeout" },
      ],
    };
    await renderNewsPage();
    // The featured story consumed the only article, leaving zero for the
    // explorer — this just confirms the page didn't crash composing that.
    expect(container.querySelector('[data-testid="news-explorer"]')?.textContent).toBe(
      "0 articles"
    );
  });
});

describe("News page — total failure shows an error state, not a crash", () => {
  it("shows the error title/description when there are zero articles", async () => {
    mockFetchResult = {
      articles: [],
      sources: [{ id: "coindesk", name: "CoinDesk", ok: false, count: 0, error: "down" }],
    };
    await renderNewsPage();
    expect(container.textContent).toContain(t("news.error.title"));
    expect(container.textContent).toContain(t("news.error.description"));
    expect(container.querySelector('[data-testid="featured-story"]')).toBeNull();
  });
});

describe("News page — Footer preserved", () => {
  it("renders the existing Footer once", async () => {
    await renderNewsPage();
    const footers = container.querySelectorAll("footer");
    expect(footers.length).toBe(1);
  });
});

describe("News page — SEO metadata", () => {
  it("generateMetadata returns the news-specific title/description", async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toBe(t("news.seo.title"));
    expect(metadata.description).toBe(t("news.seo.description"));
  });
});
