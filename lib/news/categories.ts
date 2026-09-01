import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import type { NewsCategory } from "./types";

const CATEGORY_LABEL_KEYS: Record<NewsCategory, DictionaryKey> = {
  bitcoin: "news.category.bitcoin",
  ethereum: "news.category.ethereum",
  altcoins: "news.category.altcoins",
  defi: "news.category.defi",
  regulation: "news.category.regulation",
};

export function categoryLabelKey(category: NewsCategory): DictionaryKey {
  return CATEGORY_LABEL_KEYS[category];
}

// Checked in this order — an article matching an earlier rule keeps that
// category even if a later rule's keywords also appear (e.g. a Bitcoin
// ETF story that also mentions "SEC" stays Bitcoin). Deliberately simple
// keyword matching, no paid AI classification API.
const RULES: { category: NewsCategory; pattern: RegExp }[] = [
  { category: "bitcoin", pattern: /\b(bitcoin|btc)\b/i },
  { category: "ethereum", pattern: /\b(ethereum|ether|eth)\b/i },
  {
    category: "defi",
    pattern: /\b(defi|decentralized finance|liquidity pool|yield farm(ing)?|dex)\b/i,
  },
  {
    category: "regulation",
    pattern:
      /\b(sec|cftc|regulation|regulator|regulatory|legislation|lawsuit|congress|compliance)\b/i,
  },
];

export function categorizeArticle(title: string, description: string): NewsCategory {
  const text = `${title} ${description}`;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return "altcoins";
}
