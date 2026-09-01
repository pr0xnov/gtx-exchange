/**
 * Confirmed reachable official RSS feeds only (each verified with a live
 * fetch before being added — see the task's Final Report for per-source
 * results). No HTML scraping, no invented sources.
 */
export interface NewsSourceConfig {
  id: string;
  name: string;
  feedUrl: string;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  {
    id: "coindesk",
    name: "CoinDesk",
    feedUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  },
  {
    id: "cointelegraph",
    name: "Cointelegraph",
    feedUrl: "https://cointelegraph.com/rss",
  },
  { id: "decrypt", name: "Decrypt", feedUrl: "https://decrypt.co/feed" },
  { id: "theblock", name: "The Block", feedUrl: "https://www.theblock.co/rss.xml" },
];
