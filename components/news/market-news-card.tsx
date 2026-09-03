import { ExternalLink } from "lucide-react";
import { ArticleImage } from "./article-image";
import { formatRelativeTime } from "@/lib/news/format-time";
import type { Locale } from "@/lib/i18n/config";
import type { NewsArticle } from "@/lib/news/types";

/**
 * The only News UI left in GTX — a compact card for the small "Новости
 * рынка" block on /analytics. No internal article page exists anymore
 * (see PHASE 3 of the Analytics restructuring), so this opens the
 * original publisher URL directly in a new tab rather than routing
 * anywhere inside GTX; publisher title/description are shown exactly as
 * the feed provides them, never translated or rewritten.
 */
export function MarketNewsCard({
  article,
  locale,
}: {
  article: NewsArticle;
  locale: Locale;
}) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
    >
      <ArticleImage
        src={article.image}
        alt={article.title}
        className="h-36 w-full object-cover"
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-medium text-foreground">{article.source}</span>
          <span>•</span>
          <span>{formatRelativeTime(article.publishedAt, locale)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {article.title}
        </h3>
        {article.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {article.description}
          </p>
        )}
        <ExternalLink className="mt-3 h-3.5 w-3.5 text-muted transition-colors group-hover:text-primary" />
      </div>
    </a>
  );
}
