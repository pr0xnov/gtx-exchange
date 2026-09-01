import type { Metadata } from "next";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { FeaturedStory } from "@/components/news/featured-story";
import { NewsExplorer } from "@/components/news/news-explorer";
import { Footer } from "@/components/marketing/footer";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { fetchAllNews } from "@/lib/news/fetch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("news.seo.title"),
    description: t("news.seo.description"),
  };
}

export default async function NewsPage() {
  const [user, t, { articles, sources }] = await Promise.all([
    getOptionalUser(),
    getServerTranslator(),
    fetchAllNews(),
  ]);

  const [featured, ...rest] = articles;
  const sourceNames = sources.filter((s) => s.ok && s.count > 0).map((s) => s.name);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={
          user
            ? { firstName: user.firstName, lastName: user.lastName, email: user.email }
            : null
        }
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-green-glow">
        <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="container relative animate-fade-up py-16 text-center sm:py-20">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            {t("news.hero.headingLine1")}
            <br />
            {t("news.hero.headingLine2")}
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-base leading-relaxed text-muted sm:text-lg">
            {t("news.hero.description")}
          </p>
          <Badge variant="success" className="mt-6 gap-2 rounded-full px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t("news.hero.liveIndicator")}
          </Badge>
        </div>
      </section>

      <section className="container py-12 sm:py-16">
        {!featured ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center">
            <p className="text-xl font-semibold text-foreground">
              {t("news.error.title")}
            </p>
            <p className="mt-2 text-muted">{t("news.error.description")}</p>
          </div>
        ) : (
          <>
            <FeaturedStory article={featured} />
            <div className="mt-12">
              <NewsExplorer articles={rest} sourceNames={sourceNames} />
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
