/** The 5 filterable buckets shown on /news — "all" is a UI-only pseudo
 *  category (never assigned to an article), the rest are the real,
 *  lightweight keyword-classified categories (see categories.ts). */
export type NewsCategory = "bitcoin" | "ethereum" | "altcoins" | "defi" | "regulation";

export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  url: string;
  image?: string;
  source: string;
  publishedAt: string;
  category: NewsCategory;
}
