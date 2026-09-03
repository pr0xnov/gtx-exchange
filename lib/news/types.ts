/**
 * Minimal shape for the small "Новости рынка" block on /analytics —
 * see PHASE 7/RSS SIMPLIFICATION in that feature's task history. No
 * category/tags/author/slug: this news block has no filtering, no
 * internal article page, and no per-source classification to power —
 * every card links straight to the original publisher URL.
 */
export interface NewsArticle {
  id: string;
  /** Exactly as provided by the source RSS feed — no AI translation or
   *  rewriting; GTX's own UI chrome is the only thing localized. */
  title: string;
  description?: string;
  url: string;
  image?: string;
  source: string;
  publishedAt: string;
}
