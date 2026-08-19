import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { StatsBar } from "@/components/marketing/stats-bar";
import { PopularPairs } from "@/components/marketing/popular-pairs";
import { Footer } from "@/components/marketing/footer";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { ShieldCheck, Zap, LineChart, Wallet } from "lucide-react";

export default async function HomePage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  const FEATURES = [
    {
      icon: Zap,
      title: t("marketing.home.features.zeroRisk.title"),
      description: t("marketing.home.features.zeroRisk.description"),
    },
    {
      icon: LineChart,
      title: t("marketing.home.features.charting.title"),
      description: t("marketing.home.features.charting.description"),
    },
    {
      icon: Wallet,
      title: t("marketing.home.features.balance.title"),
      description: t("marketing.home.features.balance.description"),
    },
    {
      icon: ShieldCheck,
      title: t("marketing.home.features.riskControls.title"),
      description: t("marketing.home.features.riskControls.description"),
    },
  ];

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
        <div className="container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("marketing.home.hero.titleLine1")}{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                {t("marketing.home.hero.titleHighlight")}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              {t("marketing.home.hero.subtitle")}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">{t("marketing.home.hero.startTrading")}</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/markets">{t("marketing.home.hero.viewMarkets")}</Link>
              </Button>
            </div>
          </div>

          <PhoneMockup />
        </div>

        <StatsBar />
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {t("marketing.home.features.title")}
          </h2>
          <p className="mt-3 text-muted">{t("marketing.home.features.subtitle")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular pairs */}
      <section className="container pb-20">
        <PopularPairs />
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t("marketing.home.cta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            {t("marketing.home.cta.subtitle")}
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">{t("marketing.home.cta.button")}</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
