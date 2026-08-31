import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroPhone } from "@/components/marketing/hero-phone";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { ReferralBlock } from "@/components/marketing/referral-block";
import { Footer } from "@/components/marketing/footer";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { Gift, ShieldCheck, Zap, TrendingUp, Headphones } from "lucide-react";

export default async function HomePage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  // Guest: send the bonus CTA into signup. Already authenticated: they
  // don't need another account, so it goes straight to actually claiming
  // the bonus by making a deposit.
  const primaryCtaHref = user ? "/deposit" : "/register";

  const BENEFITS = [
    {
      icon: ShieldCheck,
      title: t("marketing.home.benefits.security.title"),
      description: t("marketing.home.benefits.security.description"),
    },
    {
      icon: Zap,
      title: t("marketing.home.benefits.instant.title"),
      description: t("marketing.home.benefits.instant.description"),
    },
    {
      icon: TrendingUp,
      title: t("marketing.home.benefits.fees.title"),
      description: t("marketing.home.benefits.fees.description"),
    },
    {
      icon: Headphones,
      title: t("marketing.home.benefits.support.title"),
      description: t("marketing.home.benefits.support.description"),
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
            <Badge variant="success" className="gap-1.5 rounded-full px-3 py-1.5">
              <Gift className="h-3.5 w-3.5" />
              {t("marketing.home.hero.badge")}
            </Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("marketing.home.hero.titleLine1")}
              <br />
              {t("marketing.home.hero.titlePrefix")}
              <span className="bg-gradient-to-r from-primary to-emerald-300 bg-clip-text text-transparent">
                {t("marketing.home.hero.titleHighlight")}
              </span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
              {t("marketing.home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <Link href={primaryCtaHref}>{t("marketing.home.hero.primaryCta")}</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/markets">{t("marketing.home.hero.viewMarkets")}</Link>
              </Button>
            </div>
          </div>

          <HeroPhone />
        </div>
      </section>

      <StatsStrip />

      <ReferralBlock />

      {/* Benefits */}
      <section className="container py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
