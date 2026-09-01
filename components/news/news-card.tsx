import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import { categoryLabelKey } from "@/lib/news/categories";
import { formatRelativeTime } from "@/lib/news/format-time";
import type { NewsArticle } from "@/lib/news/types";
import { ArticleImage } from "./article-image";

/**
 * Rendered only from within NewsExplorer's client tree — no "use client"
 * of its own needed, but `t`/`locale` are passed in as props rather
 * than read via useLocale() here, so this same component could still be
 * rendered from a Server Component later without changing it.
 */
export function NewsCard({
  article,
  locale,
  t,
}: {
  article: NewsArticle;
  locale: Locale;
  t: (key: DictionaryKey) => string;
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
        className="h-40 w-full object-cover"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-medium text-foreground">{article.source}</span>
          <span>•</span>
          <span>{formatRelativeTime(article.publishedAt, locale)}</span>
        </div>
        <span className="mt-2 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          {t(categoryLabelKey(article.category))}
        </span>
        <h3 className="mt-3 line-clamp-3 font-semibold leading-snug text-foreground">
          {article.title}
        </h3>
        {article.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
            {article.description}
          </p>
        )}
        <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
          {t("news.card.readMore")}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}
