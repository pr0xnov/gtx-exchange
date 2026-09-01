import { NEWS_SOURCES, type NewsSourceConfig } from "./sources";
import { parseFeed } from "./normalize";
import type { NewsArticle } from "./types";

// Cached via Next.js's own fetch cache (same mechanism already used for
// Binance market data, see lib/binance/client.ts) — no cron, no
// database, no unstable_cache wrapper needed for a first version.
const REVALIDATE_SECONDS = 300;

export interface NewsSourceResult {
  id: string;
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface NewsFetchResult {
  articles: NewsArticle[];
  sources: NewsSourceResult[];
}

async function fetchSource(
  source: NewsSourceConfig
): Promise<{ result: NewsSourceResult; articles: NewsArticle[] }> {
  try {
    const res = await fetch(source.feedUrl, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GTXNewsBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const articles = parseFeed(xml, source.name);
    return {
      result: { id: source.id, name: source.name, ok: true, count: articles.length },
      articles,
    };
  } catch (error) {
    return {
      result: {
        id: source.id,
        name: source.name,
        ok: false,
        count: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      articles: [],
    };
  }
}

/** Same-title collapse (case/whitespace-insensitive) — the common case
 *  across crypto outlets is a shared wire story or press release running
 *  under an identical headline on multiple sites, not near-duplicate
 *  paraphrasing, so an exact normalized-title match is enough. */
function dedupeAndSort(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];
  for (const article of articles) {
    const key = article.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(article);
  }
  return unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/** Every source is fetched independently and never throws (fetchSource
 *  catches its own errors) — Promise.allSettled on top is a second,
 *  redundant safety net, so one broken feed can never take the others
 *  down with it. */
export async function fetchAllNews(): Promise<NewsFetchResult> {
  const settled = await Promise.allSettled(NEWS_SOURCES.map(fetchSource));

  const sources: NewsSourceResult[] = [];
  const allArticles: NewsArticle[] = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i]!;
    const source = NEWS_SOURCES[i]!;
    if (outcome.status === "fulfilled") {
      sources.push(outcome.value.result);
      allArticles.push(...outcome.value.articles);
    } else {
      sources.push({
        id: source.id,
        name: source.name,
        ok: false,
        count: 0,
        error: "Unexpected failure",
      });
    }
  }

  return { articles: dedupeAndSort(allArticles), sources };
}
