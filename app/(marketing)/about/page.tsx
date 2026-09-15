import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { AboutDashboardPreview } from "@/components/marketing/about-dashboard-preview";
import { Footer } from "@/components/marketing/footer";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { Zap, Layers, Shield, Clock, Lock, Activity } from "lucide-react";

export default async function AboutPage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  // "Почати торгувати" always keeps the same label — only its
  // destination depends on auth state (guest has no positions to trade
  // into yet, so /register comes first).
  const heroPrimaryHref = user ? "/trading" : "/register";

  const finalCta = user
    ? { label: t("marketing.about.hero.primaryCta"), href: "/trading" }
    : { label: t("marketing.about.finalCta.primaryGuest"), href: "/register" };

  const STATS = [
    {
      value: t("marketing.about.stats.assets.value"),
      label: t("marketing.about.stats.assets.label"),
    },
    {
      value: t("marketing.about.stats.uptime.value"),
      label: t("marketing.about.stats.uptime.label"),
    },
    {
      value: t("marketing.about.stats.currency.value"),
      label: t("marketing.about.stats.currency.label"),
    },
    {
      value: t("marketing.about.stats.fee.value"),
      label: t("marketing.about.stats.fee.label"),
    },
  ];

  const WHY_CARDS = [
    {
      icon: Zap,
      title: t("marketing.about.why.speed.title"),
      description: t("marketing.about.why.speed.description"),
    },
    {
      icon: Layers,
      title: t("marketing.about.why.simplicity.title"),
      description: t("marketing.about.why.simplicity.description"),
    },
    {
      icon: Shield,
      title: t("marketing.about.why.control.title"),
      description: t("marketing.about.why.control.description"),
    },
    {
      icon: Clock,
      title: t("marketing.about.why.available.title"),
      description: t("marketing.about.why.available.description"),
    },
  ];

  const SECURITY_ITEMS = [
    {
      icon: Shield,
      title: t("marketing.about.security.accountProtection.title"),
      description: t("marketing.about.security.accountProtection.description"),
    },
    {
      icon: Lock,
      title: t("marketing.about.security.twoFactor.title"),
      description: t("marketing.about.security.twoFactor.description"),
    },
    {
      icon: Activity,
      title: t("marketing.about.security.activityControl.title"),
      description: t("marketing.about.security.activityControl.description"),
    },
  ];

  const VALUES = [
    {
      number: "01",
      title: t("marketing.about.values.simplicity.title"),
      description: t("marketing.about.values.simplicity.description"),
    },
    {
      number: "02",
      title: t("marketing.about.values.speed.title"),
      description: t("marketing.about.values.speed.description"),
    },
    {
      number: "03",
      title: t("marketing.about.values.transparency.title"),
      description: t("marketing.about.values.transparency.description"),
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
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative animate-fade-up py-20 text-center sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("marketing.about.hero.titleLine1")}
            <br />
            {t("marketing.about.hero.titleLine2")}{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
              {t("marketing.about.hero.titleHighlight")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-base leading-relaxed text-muted sm:text-lg">
            {t("marketing.about.hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={heroPrimaryHref}>{t("marketing.about.hero.primaryCta")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/markets">{t("marketing.home.hero.viewMarkets")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container pb-16">
        <div className="grid grid-cols-2 divide-y divide-border/60 rounded-3xl border border-border bg-card sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {STATS.map((s) => (
            <div key={s.label} className="p-6 text-center sm:p-8">
              <div className="text-3xl font-extrabold text-foreground sm:text-4xl">
                {s.value}
              </div>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="container py-16 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="text-xs font-semibold tracking-widest text-primary">
              {t("marketing.about.mission.label")}
            </div>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t("marketing.about.mission.headingLine1")}
              <br />
              {t("marketing.about.mission.headingLine2")}
            </h2>
          </div>
          <div className="space-y-4 text-base leading-relaxed text-muted">
            <p>{t("marketing.about.mission.paragraph1")}</p>
            <p>{t("marketing.about.mission.paragraph2")}</p>
          </div>
        </div>
      </section>

      {/* Why GTX */}
      <section className="container py-16 sm:py-24">
        <div className="mb-12 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("marketing.about.why.title")}
          </h2>
          <p className="mt-3 text-muted">{t("marketing.about.why.subtitle")}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CARDS.map((c) => (
            <div
              key={c.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{c.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform visual */}
      <section className="container py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t("marketing.about.platform.headingLine1")}
              <br />
              {t("marketing.about.platform.headingLine2")}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
              {t("marketing.about.platform.description")}
            </p>
          </div>
          <AboutDashboardPreview />
        </div>
      </section>

      {/* Security */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_50%_40%_at_50%_50%,black,transparent)]" />
        <div className="container relative">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs font-semibold tracking-widest text-primary">
              {t("marketing.about.security.label")}
            </div>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t("marketing.about.security.headingLine1")}
              <br />
              {t("marketing.about.security.headingLine2")}
            </h2>
            <p className="mt-4 text-muted">{t("marketing.about.security.description")}</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-3">
            {SECURITY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
              >
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="container py-16 sm:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("marketing.about.values.title")}
        </h2>
        <div className="grid gap-10 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.number}>
              <div className="font-tabular text-sm font-semibold text-primary">
                {v.number}
              </div>
              <h3 className="mt-2 text-2xl font-bold text-foreground">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="text-xs font-semibold tracking-widest text-primary">
              {t("marketing.about.finalCta.label")}
            </div>
            <h2 className="mx-auto mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              {t("marketing.about.finalCta.headingLine1")}
              <br />
              {t("marketing.about.finalCta.headingLine2")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              {t("marketing.about.finalCta.description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href={finalCta.href}>{finalCta.label}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/markets">{t("marketing.home.hero.viewMarkets")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
