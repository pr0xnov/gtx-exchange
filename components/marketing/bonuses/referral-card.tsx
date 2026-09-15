import Link from "next/link";
import { User, UserPlus, Link2, Gift, CheckCircle2, Ban } from "lucide-react";
import { getServerTranslator } from "@/lib/i18n/get-locale";
import { Button } from "@/components/ui/button";
import { CopyReferralCodeButton } from "@/components/marketing/bonuses/copy-referral-code-button";

/**
 * Right card of the two-card /bonuses hero row. Purely presentational —
 * the 10%/cap/examples/rules text below describes the existing referral-
 * reward business rule (see lib/referral/reward.ts and rules.ts), never a
 * second implementation of it: the reward is only ever actually computed
 * and paid server-side, inside the deposit-approval transaction.
 *
 * The CTA reuses CopyReferralCodeButton — the same component (and the
 * same real, permanent referralCode prop) the personal referral section
 * further down the page uses — rather than a second copy-to-clipboard
 * implementation.
 */
export async function ReferralCard({
  isAuthenticated,
  referralCode,
}: {
  isAuthenticated: boolean;
  referralCode: string | null;
}) {
  const t = await getServerTranslator();

  const EXAMPLES = [
    {
      from: t("marketing.bonuses.referral.example1From"),
      to: t("marketing.bonuses.referral.example1To"),
    },
    {
      from: t("marketing.bonuses.referral.example2From"),
      to: t("marketing.bonuses.referral.example2To"),
    },
    {
      from: t("marketing.bonuses.referral.example3From"),
      to: t("marketing.bonuses.referral.example3To"),
    },
    {
      from: t("marketing.bonuses.referral.example4From"),
      to: t("marketing.bonuses.referral.example4To"),
      isMax: true,
    },
  ];

  const RULES = [
    { icon: Gift, label: t("marketing.bonuses.referral.maxNote") },
    { icon: CheckCircle2, label: t("marketing.bonuses.referral.rule2") },
    { icon: Ban, label: t("marketing.bonuses.referral.registrationNote") },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 shadow-glow sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-tabular text-4xl font-extrabold text-primary sm:text-5xl">
            {t("marketing.bonuses.referral.badge")}
          </div>
          <h2 className="mt-3 max-w-[16ch] text-xl font-bold leading-snug text-foreground">
            {t("marketing.bonuses.referral.title")}
          </h2>
        </div>

        {/* User-connection visual — pure CSS + icons, no image dependency */}
        <div className="relative hidden shrink-0 items-center gap-1.5 sm:flex">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl" />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/30 to-primary/5">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Link2 className="h-3.5 w-3.5" />
          </div>
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/30 to-primary/5">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        {t("marketing.bonuses.referral.description")}
      </p>

      <div className="mt-5 rounded-2xl border border-border bg-surface/60 p-4">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {t("marketing.bonuses.referral.examplesLabel")}
        </div>
        <div className="mt-2.5 space-y-2">
          {EXAMPLES.map((ex) => (
            <div
              key={ex.from}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-tabular text-muted">{ex.from}</span>
              <span className="flex items-center gap-1.5">
                <span className="font-tabular font-semibold text-primary">{ex.to}</span>
                {ex.isMax && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {t("marketing.bonuses.referral.maxLabel")}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        {isAuthenticated && referralCode ? (
          <CopyReferralCodeButton
            referralCode={referralCode}
            size="lg"
            className="w-full"
          />
        ) : (
          <Button size="lg" className="w-full" asChild>
            <Link href="/register">{t("marketing.bonuses.guestCta.registerButton")}</Link>
          </Button>
        )}
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
