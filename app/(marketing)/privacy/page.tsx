import type { Metadata } from "next";
import Link from "next/link";
import { getOptionalUser } from "@/lib/auth/session";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/marketing/accordion";
import { Footer } from "@/components/marketing/footer";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import {
  Eye,
  Database,
  ShieldCheck,
  UserCheck,
  Lock,
  Server,
  Cookie,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslator();
  return {
    title: t("privacy.seo.title"),
    description: t("privacy.seo.description"),
  };
}

export default async function PrivacyPage() {
  const user = await getOptionalUser();
  const t = await getServerTranslator();

  const PRINCIPLES = [
    {
      icon: Eye,
      title: t("privacy.principles.transparency.title"),
      description: t("privacy.principles.transparency.description"),
    },
    {
      icon: Database,
      title: t("privacy.principles.minimization.title"),
      description: t("privacy.principles.minimization.description"),
    },
    {
      icon: ShieldCheck,
      title: t("privacy.principles.accountability.title"),
      description: t("privacy.principles.accountability.description"),
    },
    {
      icon: UserCheck,
      title: t("privacy.principles.userRights.title"),
      description: t("privacy.principles.userRights.description"),
    },
    {
      icon: Lock,
      title: t("privacy.principles.dataProtection.title"),
      description: t("privacy.principles.dataProtection.description"),
    },
  ];

  const PERSONAL_DATA_EXAMPLES: DictionaryKey[] = [
    "privacy.usage.personalData.example1",
    "privacy.usage.personalData.example2",
    "privacy.usage.personalData.example3",
    "privacy.usage.personalData.example4",
  ];

  const HOW_WE_USE_ITEMS: DictionaryKey[] = [
    "privacy.usage.howWeUse.item1",
    "privacy.usage.howWeUse.item2",
    "privacy.usage.howWeUse.item3",
    "privacy.usage.howWeUse.item4",
    "privacy.usage.howWeUse.item5",
    "privacy.usage.howWeUse.item6",
    "privacy.usage.howWeUse.item7",
    "privacy.usage.howWeUse.item8",
    "privacy.usage.howWeUse.item9",
    "privacy.usage.howWeUse.item10",
  ];

  const COOKIE_ITEMS: DictionaryKey[] = [
    "privacy.usage.cookies.item1",
    "privacy.usage.cookies.item2",
    "privacy.usage.cookies.item3",
    "privacy.usage.cookies.item4",
  ];

  const RIGHTS = [
    "access",
    "rectification",
    "erasure",
    "restriction",
    "objection",
    "withdrawConsent",
    "portability",
  ].map((key) => ({
    question: t(`privacy.rights.${key}.question` as DictionaryKey),
    answer: t(`privacy.rights.${key}.answer` as DictionaryKey),
  }));

  const FAQ = ["q1", "q2", "q3", "q4", "q5", "q6"].map((key) => ({
    question: t(`privacy.faq.${key}.question` as DictionaryKey),
    answer: t(`privacy.faq.${key}.answer` as DictionaryKey),
  }));

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
        <div className="container relative animate-fade-up py-20 text-center sm:py-28">
          <Badge variant="success" className="rounded-full px-3 py-1.5">
            {t("privacy.hero.label")}
          </Badge>
          <h1 className="mx-auto mt-6 max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            {t("privacy.hero.headingLine1")}
            <br />
            {t("privacy.hero.headingLine2")}
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-base leading-relaxed text-muted sm:text-lg">
            {t("privacy.hero.subtitle")}
          </p>
          <p className="mt-6 text-sm font-medium text-primary">
            {t("privacy.hero.tagline")}
          </p>
          <p className="mt-2 text-xs text-muted">{t("privacy.hero.lastUpdated")}</p>
        </div>
      </section>

      {/* Privacy principles */}
      <section className="container py-16 sm:py-24">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("privacy.principles.title")}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How GTX uses your data */}
      <section className="container py-16 sm:py-24">
        <h2 className="mb-12 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("privacy.usage.title")}
        </h2>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground">
              {t("privacy.usage.personalData.title")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("privacy.usage.personalData.paragraph1")}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("privacy.usage.personalData.paragraph2")}
            </p>
            <p className="mt-4 text-sm font-medium text-foreground">
              {t("privacy.usage.personalData.examplesIntro")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {PERSONAL_DATA_EXAMPLES.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground">
              {t("privacy.usage.howWeUse.title")}
            </h3>
            <p className="mt-3 text-sm font-medium text-foreground">
              {t("privacy.usage.howWeUse.intro")}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {HOW_WE_USE_ITEMS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("privacy.usage.retention.title")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("privacy.usage.retention.description")}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-foreground">
              {t("privacy.usage.thirdParties.title")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("privacy.usage.thirdParties.description")}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cookie className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t("privacy.usage.cookies.title")}
            </h3>
            <p className="mt-3 text-sm font-medium text-foreground">
              {t("privacy.usage.cookies.intro")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {COOKIE_ITEMS.map((key) => (
                <li key={key} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy rights */}
      <section className="container py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("privacy.rights.title")}
          </h2>
          <p className="mt-4 text-muted">{t("privacy.rights.intro")}</p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl">
          <Accordion items={RIGHTS} />
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 sm:py-24">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("privacy.faq.title")}
        </h2>
        <div className="mx-auto max-w-3xl">
          <Accordion items={FAQ} />
        </div>
      </section>

      {/* Support CTA */}
      <section className="container pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center sm:p-16">
          <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("privacy.support.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              {t("privacy.support.description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contacts">{t("privacy.support.primaryCta")}</Link>
              </Button>
              {user && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/account">{t("privacy.support.secondaryCta")}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
