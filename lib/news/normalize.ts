import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "./types";
import { categorizeArticle } from "./categories";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const MAX_DESCRIPTION_LENGTH = 220;

/**
 * External RSS content is untrusted: strips every HTML tag (feeds like
 * Cointelegraph embed raw `<img>`/`<p>` markup straight in <description>)
 * and decodes the handful of entities that survive fast-xml-parser's own
 * XML-entity decoding, rather than ever rendering it as HTML.
 */
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isSafeUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** RSS has no single standard for images — checks every convention the
 *  4 confirmed sources actually use, in order, and takes the first valid
 *  one. Missing/invalid on all of them just means no image (handled by
 *  the UI's own placeholder, never a broken <img>). */
function extractImage(item: Record<string, unknown>): string | undefined {
  const candidates = [
    (item["media:content"] as Record<string, unknown> | undefined)?.["@_url"],
    (item["enclosure"] as Record<string, unknown> | undefined)?.["@_url"],
    (item["media:thumbnail"] as Record<string, unknown> | undefined)?.["@_url"],
  ];
  return candidates.find(isSafeUrl);
}

function toIsoDate(value: unknown): string {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

/** Parses one source's raw RSS XML into our normalized NewsArticle[].
 *  Never throws on malformed items — a single bad <item> is skipped
 *  rather than failing the whole source (see fetch.ts for the
 *  whole-source failure isolation on top of this). */
export function parseFeed(xml: string, sourceName: string): NewsArticle[] {
  let parsed: unknown;
  try {
    parsed = parser.parse(xml);
  } catch {
    return [];
  }

  const channel = (parsed as Record<string, Record<string, unknown>> | undefined)?.rss
    ?.channel as Record<string, unknown> | undefined;
  const rawItems = channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const articles: NewsArticle[] = [];
  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) continue;
    const item = raw as Record<string, unknown>;

    const rawTitle = item.title;
    const rawLink = item.link;
    if (typeof rawTitle !== "string" || !isSafeUrl(rawLink)) continue;

    const title = stripHtml(rawTitle);
    if (!title) continue;

    const rawDescription = item.description;
    const description =
      typeof rawDescription === "string"
        ? stripHtml(rawDescription).slice(0, MAX_DESCRIPTION_LENGTH)
        : undefined;

    articles.push({
      id: rawLink,
      title,
      description: description || undefined,
      url: rawLink,
      image: extractImage(item),
      source: sourceName,
      publishedAt: toIsoDate(item.pubDate),
      category: categorizeArticle(title, description ?? ""),
    });
  }
  return articles;
}
