import Link from "next/link";
import { Coins, TrendingUp, Gift, CheckCircle2, Ban, ArrowRight } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { Button } from "@/components/ui/button";

/**
 * Left card of the two-card /bonuses hero row. Purely presentational —
 * the +20%/examples/rules text below is copy describing the existing
 * first-deposit-bonus business rule (see lib/bonus/first-deposit.ts),
 * never a second implementation of it. The CTA just routes to the
 * existing /deposit page (authenticated) or /register (guest); neither
 * button does anything deposit/bonus logic doesn't already handle.
 */
export async function FirstDepositCard({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const t = await getServerTranslator();

  const EXAMPLES = [
    {
      from: t("marketing.bonuses.firstDeposit.example1From"),
      to: t("marketing.bonuses.firstDeposit.example1To"),
    },
    {
      from: t("marketing.bonuses.firstDeposit.example2From"),
      to: t("marketing.bonuses.firstDeposit.example2To"),
    },
    {
      from: t("marketing.bonuses.firstDeposit.example3From"),
      to: t("marketing.bonuses.firstDeposit.example3To"),
    },
  ];

  const RULES = [
    { icon: Gift, label: t("marketing.bonuses.firstDeposit.rule1") },
    { icon: CheckCircle2, label: t("marketing.bonuses.firstDeposit.rule2") },
    { icon: Ban, label: t("marketing.bonuses.firstDeposit.rule3") },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 shadow-glow sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-tabular text-4xl font-extrabold text-primary sm:text-5xl">
            {t("marketing.bonuses.firstDeposit.badge")}
          </div>
          <h2 className="mt-3 max-w-[15ch] text-xl font-bold leading-snug text-foreground">
            {t("marketing.bonuses.firstDeposit.title")}
          </h2>
        </div>

        {/* Coin/growth visual — pure CSS + icons, no image dependency */}
        <div className="relative hidden h-16 w-16 shrink-0 items-center justify-center sm:flex">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/30 to-primary/5">
            <Coins className="h-7 w-7 text-primary" />
          </div>
          <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {t("marketing.bonuses.firstDeposit.description")}
      </p>

      <div className="mt-5 rounded-2xl border border-border bg-surface/60 p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {t("marketing.bonuses.firstDeposit.examplesLabel")}
        </div>
        <div className="mt-2.5 space-y-2">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.from}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-tabular text-muted">{ex.from}</span>
              <span className="font-tabular font-semibold text-primary">{ex.to}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <Button size="lg" className="w-full" asChild>
          <Link href={isAuthenticated ? "/deposit" : "/register"}>
            {isAuthenticated
              ? t("account.makeDeposit")
              : t("marketing.bonuses.guestCta.registerButton")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <ul className="mt-6 space-y-2.5 border-t border-border/60 pt-5">
        {RULES.map((rule) => (
          <li key={rule.label} className="flex items-center gap-2.5 text-sm text-muted">
            <rule.icon className="h-4 w-4 shrink-0 text-primary" />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
