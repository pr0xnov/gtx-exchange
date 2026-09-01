// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { NewsExplorer } from "@/components/news/news-explorer";
import type { NewsArticle } from "@/lib/news/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

function makeArticle(overrides: Partial<NewsArticle>): NewsArticle {
  return {
    id: overrides.url ?? "https://example.com/x",
    title: "Some story",
    description: "Some description",
    url: "https://example.com/x",
    source: "CoinDesk",
    publishedAt: new Date().toISOString(),
    category: "altcoins",
    ...overrides,
  };
}

const ARTICLES: NewsArticle[] = [
  makeArticle({
    id: "1",
    url: "https://example.com/1",
    title: "Bitcoin surges past resistance",
    category: "bitcoin",
    source: "CoinDesk",
  }),
  makeArticle({
    id: "2",
    url: "https://example.com/2",
    title: "Ethereum upgrade ships",
    category: "ethereum",
    source: "Decrypt",
  }),
  makeArticle({
    id: "3",
    url: "https://example.com/3",
    title: "DeFi protocol exploited",
    category: "defi",
    source: "The Block",
  }),
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(
  articles: NewsArticle[] = ARTICLES,
  sourceNames: string[] = ["CoinDesk", "Decrypt", "The Block"]
) {
  act(() => {
    root.render(
      React.createElement(
        LocaleProvider,
        { initialLocale: "en" },
        React.createElement(NewsExplorer, { articles, sourceNames })
      )
    );
  });
}

function categoryButton(text: string): HTMLButtonElement {
  return Array.from(container.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLButtonElement;
}

describe("NewsExplorer — category filter", () => {
  it("shows all articles by default", () => {
    render();
    expect(container.textContent).toContain("Bitcoin surges past resistance");
    expect(container.textContent).toContain("Ethereum upgrade ships");
    expect(container.textContent).toContain("DeFi protocol exploited");
  });

  it("filters to only Bitcoin articles when the Bitcoin chip is clicked", () => {
    render();
    act(() => categoryButton("Bitcoin").click());
    expect(container.textContent).toContain("Bitcoin surges past resistance");
    expect(container.textContent).not.toContain("Ethereum upgrade ships");
    expect(container.textContent).not.toContain("DeFi protocol exploited");
  });

  it("clicking All restores the full list", () => {
    render();
    act(() => categoryButton("Bitcoin").click());
    act(() => categoryButton("All").click());
    expect(container.textContent).toContain("Ethereum upgrade ships");
  });
});

describe("NewsExplorer — source filter", () => {
  it("filters to only the selected source", () => {
    render();
    const select = container.querySelector("select") as HTMLSelectElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(select, "Decrypt");
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.textContent).toContain("Ethereum upgrade ships");
    expect(container.textContent).not.toContain("Bitcoin surges past resistance");
  });

  it("lists only the given source names as options, plus 'All sources'", () => {
    render();
    const options = Array.from(container.querySelectorAll("option")).map(
      (o) => o.textContent
    );
    expect(options).toEqual(["All sources", "CoinDesk", "Decrypt", "The Block"]);
  });
});

describe("NewsExplorer — search", () => {
  it("filters by title, description, or source without any network request", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render();
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(input, "ethereum");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("Ethereum upgrade ships");
    expect(container.textContent).not.toContain("Bitcoin surges past resistance");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("matches by source name too", () => {
    render();
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(input, "the block");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("DeFi protocol exploited");
    expect(container.textContent).not.toContain("Bitcoin surges past resistance");
  });

  it("shows the empty state when nothing matches", () => {
    render();
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    )!.set!;
    act(() => {
      setter.call(input, "nonexistent-zzz");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.textContent).toContain("No news found");
  });
});

describe("NewsExplorer — load more", () => {
  it("shows only 12 articles initially and reveals more on click, with no button once everything is shown", () => {
    const many: NewsArticle[] = Array.from({ length: 15 }, (_, i) =>
      makeArticle({
        id: String(i),
        url: `https://example.com/${i}`,
        title: `Story number ${i}`,
      })
    );
    render(many, ["CoinDesk"]);

    expect(container.textContent).toContain("Story number 0");
    expect(container.textContent).toContain("Story number 11");
    expect(container.textContent).not.toContain("Story number 12");

    const loadMore = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Show more"
    )!;
    expect(loadMore).not.toBeUndefined();
    act(() => loadMore.click());

    expect(container.textContent).toContain("Story number 14");
    expect(
      Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent === "Show more"
      )
    ).toBeUndefined();
  });
});
