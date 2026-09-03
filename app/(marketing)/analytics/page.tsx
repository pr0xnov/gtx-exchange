import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth/session";
import { getServerLocale, getServerTranslator } from "@/lib/i18n/get-locale";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { MarketNewsCard } from "@/components/news/market-news-card";
import { fetchAllNews } from "@/lib/news/fetch";

const MARKET_NEWS_COUNT = 3;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("analytics.seo.title"),
    description: t("analytics.seo.description"),
  };
}

/**
 * Replaces the old standalone News feature (listing page + internal
 * article pages) with a single crypto-market analytics page. Every price/
 * change/volume figure comes from GTX's own existing market-data stack
 * (see components/analytics/analytics-dashboard.tsx) — no new API, no new
 * WebSocket, no fabricated numbers. The only remaining News code is the
 * small "Новости рынка" block below, server-rendered from the same
 * lightweight RSS aggregator as before; each card opens the original
 * publisher URL in a new tab (see components/news/market-news-card.tsx) —
 * there's no internal article page left for it to route to.
 */
export default async function AnalyticsPage() {
  const [user, t, locale, { articles }] = await Promise.all([
    getOptionalUser(),
    getServerTranslator(),
    getServerLocale(),
    fetchAllNews(),
  ]);

  const marketNews = articles.slice(0, MARKET_NEWS_COUNT);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={
          user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
            : null
        }
      />

      <section className="container py-10 sm:py-14">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {t("analytics.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">{t("analytics.subtitle")}</p>
        </div>

        <div className="mx-auto mt-10 max-w-6xl">
          <AnalyticsDashboard isAuthenticated={Boolean(user)} />

          {marketNews.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground">
                {t("analytics.news.title")}
              </h2>
              <div className="mt-3 grid gap-5 sm:grid-cols-3">
                {marketNews.map((article) => (
                  <MarketNewsCard key={article.id} article={article} locale={locale} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
