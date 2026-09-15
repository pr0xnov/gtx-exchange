import Link from "next/link";
import { Percent, Share2, UserPlus, Wallet } from "lucide-react";
import { getOptionalUserAllowingRefresh } from "@/lib/auth/session";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/marketing/accordion";
import { ReferralCodeCard } from "@/components/marketing/bonuses/referral-code-card";
import { FirstDepositCard } from "@/components/marketing/bonuses/first-deposit-card";
import { ReferralCard } from "@/components/marketing/bonuses/referral-card";

/**
 * Public/authenticated bonus explainer + personal referral hub. Guest vs
 * authenticated is branched server-side (getOptionalUserAllowingRefresh,
 * same helper the Navbar itself uses for display-only auth checks) rather
 * than client-side, so a guest never even fires a doomed 401 request for
 * referral stats — see components/marketing/bonuses/referral-code-card.tsx,
 * which is only ever mounted for a real, authenticated user.
 *
 * Page order: hero -> the two premium bonus cards -> how it works -> the
 * authenticated user's personal referral code/stats (or a guest CTA) ->
 * FAQ. All business rules (the +20% first-deposit bonus, the 10%-capped-
 * at-100 referral reward, the first-successful-deposit requirement) live
 * entirely in lib/bonus/first-deposit.ts and lib/referral/reward.ts —
 * this file and its card components are copy/layout only.
 */
export default async function BonusesPage() {
  const user = await getOptionalUserAllowingRefresh();
  const t = await getServerTranslator();

  const STEPS = [
    {
      icon: Share2,
      title: t("marketing.bonuses.howItWorks.step1Title"),
      description: t("marketing.bonuses.howItWorks.step1Description"),
    },
    {
      icon: UserPlus,
      title: t("marketing.bonuses.howItWorks.step2Title"),
      description: t("marketing.bonuses.howItWorks.step2Description"),
    },
    {
      icon: Wallet,
      title: t("marketing.bonuses.howItWorks.step3Title"),
      description: t("marketing.bonuses.howItWorks.step3Description"),
    },
  ];

  const FAQ_ITEMS = [
    { question: t("marketing.bonuses.faq.q1"), answer: t("marketing.bonuses.faq.a1") },
    { question: t("marketing.bonuses.faq.q2"), answer: t("marketing.bonuses.faq.a2") },
    { question: t("marketing.bonuses.faq.q3"), answer: t("marketing.bonuses.faq.a3") },
    { question: t("marketing.bonuses.faq.q4"), answer: t("marketing.bonuses.faq.a4") },
    { question: t("marketing.bonuses.faq.q5"), answer: t("marketing.bonuses.faq.a5") },
    { question: t("marketing.bonuses.faq.q6"), answer: t("marketing.bonuses.faq.a6") },
    { question: t("marketing.bonuses.faq.q7"), answer: t("marketing.bonuses.faq.a7") },
    { question: t("marketing.bonuses.faq.q8"), answer: t("marketing.bonuses.faq.a8") },
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

      {/* Hero — no small eyebrow/badge above the heading, per design */}
      <section className="relative overflow-hidden bg-green-glow">
        <div className="absolute inset-0 bg-grid-fade bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        <div className="container relative py-12 text-center sm:py-16">
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            {t("marketing.bonuses.hero.heading")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {t("marketing.bonuses.hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Two premium bonus cards — equal height via grid's default stretch,
          each card's own CTA/rules pinned to the bottom via mt-auto-like
          flex layout inside the card, so the bottom edges align even
          though the referral card has one more example row. */}
      <section className="container pb-16">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <FirstDepositCard isAuthenticated={Boolean(user)} />
          <ReferralCard
            isAuthenticated={Boolean(user)}
            referralCode={user?.referralCode ?? null}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="container pb-16 sm:pb-24">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("marketing.bonuses.howItWorks.title")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6 text-center"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </div>
              <step.icon className="mx-auto mt-3 h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Personal referral section / guest CTA */}
      <section className="container pb-16">
        {user ? (
          <ReferralCodeCard referralCode={user.referralCode} />
        ) : (
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center sm:p-12">
            <Percent className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-4 text-xl font-bold text-foreground">
              {t("marketing.bonuses.guestCta.title")}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              {t("marketing.bonuses.guestCta.description")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">
                  {t("marketing.bonuses.guestCta.registerButton")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">{t("marketing.bonuses.guestCta.loginButton")}</Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="container pb-16 sm:pb-24">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("marketing.bonuses.faq.title")}
        </h2>
        <div className="mx-auto max-w-3xl">
          <Accordion items={FAQ_ITEMS} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
