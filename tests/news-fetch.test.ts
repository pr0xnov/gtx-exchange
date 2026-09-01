import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllNews } from "@/lib/news/fetch";
import { NEWS_SOURCES } from "@/lib/news/sources";

function rss(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>${items}</channel></rss>`;
}

function item(title: string, link: string, pubDate: string): string {
  return `<item><title>${title}</title><link>${link}</link><pubDate>${pubDate}</pubDate></item>`;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAllNews — failure isolation", () => {
  it("returns articles from working sources even when one source's fetch rejects", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("theblock")) return Promise.reject(new Error("network down"));
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            rss(
              item(
                "Story from " + url,
                "https://example.com/" + url.length,
                "Mon, 31 Aug 2026 12:00:00 +0000"
              )
            )
          ),
      });
    });

    const { articles, sources } = await fetchAllNews();

    expect(sources).toHaveLength(NEWS_SOURCES.length);
    const theBlockResult = sources.find((s) => s.id === "theblock");
    expect(theBlockResult?.ok).toBe(false);
    expect(theBlockResult?.error).toContain("network down");

    const okSources = sources.filter((s) => s.ok);
    expect(okSources.length).toBe(NEWS_SOURCES.length - 1);
    expect(articles.length).toBeGreaterThan(0);
  });

  it("returns an empty article list (not a throw) when every source fails", async () => {
    fetchMock.mockRejectedValue(new Error("all down"));
    const { articles, sources } = await fetchAllNews();
    expect(articles).toEqual([]);
    expect(sources.every((s) => !s.ok)).toBe(true);
  });

  it("treats a non-OK HTTP response as a source failure, not a thrown error", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: () => Promise.resolve(""),
    });
    const { articles, sources } = await fetchAllNews();
    expect(articles).toEqual([]);
    expect(sources.every((s) => !s.ok && s.error?.includes("503"))).toBe(true);
  });
});

describe("fetchAllNews — dedupe and sort", () => {
  it("collapses articles with the exact same title across sources and sorts newest first", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("coindesk")) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              rss(
                item(
                  "Shared headline",
                  "https://coindesk.example/a",
                  "Mon, 31 Aug 2026 10:00:00 +0000"
                ) +
                  item(
                    "Older CoinDesk story",
                    "https://coindesk.example/b",
                    "Sun, 30 Aug 2026 10:00:00 +0000"
                  )
              )
            ),
        });
      }
      if (url.includes("cointelegraph")) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(
              rss(
                item(
                  "Shared headline",
                  "https://cointelegraph.example/a",
                  "Mon, 31 Aug 2026 09:00:00 +0000"
                )
              )
            ),
        });
      }
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            rss(
              item(
                "Newest story",
                "https://example.com/newest",
                "Mon, 31 Aug 2026 12:00:00 +0000"
              )
            )
          ),
      });
    });

    const { articles } = await fetchAllNews();

    const sharedCount = articles.filter((a) => a.title === "Shared headline").length;
    expect(sharedCount).toBe(1);

    const publishedTimes = articles.map((a) => new Date(a.publishedAt).getTime());
    const sortedDesc = [...publishedTimes].sort((a, b) => b - a);
    expect(publishedTimes).toEqual(sortedDesc);
    expect(articles[0]!.title).toBe("Newest story");
  });
});
