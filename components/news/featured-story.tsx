import { ArrowUpRight } from "lucide-react";
import { getServerTranslator, getServerLocale } from "@/lib/i18n/get-locale";
import { categoryLabelKey } from "@/lib/news/categories";
import { formatRelativeTime } from "@/lib/news/format-time";
import type { NewsArticle } from "@/lib/news/types";
import { ArticleImage } from "./article-image";

export async function FeaturedStory({ article }: { article: NewsArticle }) {
  const t = await getServerTranslator();
  const locale = await getServerLocale();

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group grid overflow-hidden rounded-3xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-glow lg:grid-cols-2"
    >
      <ArticleImage
        src={article.image}
        alt={article.title}
        className="h-56 w-full object-cover lg:h-full"
      />
      <div className="flex flex-col justify-center p-6 sm:p-8">
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="font-medium text-foreground">{article.source}</span>
          <span>•</span>
          <span>{formatRelativeTime(article.publishedAt, locale)}</span>
        </div>
        <span className="mt-3 w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {t(categoryLabelKey(article.category))}
        </span>
        <h2 className="mt-4 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          {article.title}
        </h2>
        {article.description && (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
            {article.description}
          </p>
        )}
        <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary">
          {t("news.featured.readMore")}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
}
