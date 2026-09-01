"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { categoryLabelKey } from "@/lib/news/categories";
import type { NewsArticle, NewsCategory } from "@/lib/news/types";
import { NewsCard } from "./news-card";

const CATEGORIES: NewsCategory[] = [
  "bitcoin",
  "ethereum",
  "altcoins",
  "defi",
  "regulation",
];
const PAGE_SIZE = 12;

export function NewsExplorer({
  articles,
  sourceNames,
}: {
  articles: NewsArticle[];
  sourceNames: string[];
}) {
  const { t, locale } = useLocale();
  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [source, setSource] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function resetPaging() {
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (source !== "all" && a.source !== source) return false;
      if (q.length > 0) {
        const haystack = `${a.title} ${a.description ?? ""} ${a.source}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [articles, category, source, query]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => {
            setCategory("all");
            resetPaging();
          }}
          className={
            category === "all"
              ? "shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
              : "shrink-0 whitespace-nowrap rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
          }
        >
          {t("news.category.all")}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              resetPaging();
            }}
            className={
              category === c
                ? "shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "shrink-0 whitespace-nowrap rounded-full border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            }
          >
            {t(categoryLabelKey(c))}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              resetPaging();
            }}
            placeholder={t("news.search.placeholder")}
            className="pl-9"
          />
        </div>
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            resetPaging();
          }}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground sm:w-56"
        >
          <option value="all">{t("news.sourceFilter.all")}</option>
          {sourceNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="mb-5 mt-10 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {t("news.latest.title")}
      </h2>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <p className="font-semibold text-foreground">{t("news.empty.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("news.empty.description")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} t={t} />
            ))}
          </div>

          {visibleCount < filtered.length && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
              >
                {t("news.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
