"use client";

import { Users, Gift, Wallet } from "lucide-react";
import { useReferralStats } from "@/hooks/use-api";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";
import { CopyReferralCodeButton } from "@/components/marketing/bonuses/copy-referral-code-button";

/**
 * Only ever rendered for an authenticated user (see app/bonuses/page.tsx,
 * which branches server-side on getOptionalUserAllowingRefresh() and
 * renders BonusesGuestCta instead for a guest) — referralCode is that
 * user's real, permanent code (see User.referralCode), never regenerated
 * or fetched separately here.
 */
export function ReferralCodeCard({ referralCode }: { referralCode: string }) {
  const { t } = useLocale();
  const { data: stats, isLoading: statsLoading } = useReferralStats();

  const STATS = [
    { icon: Users, label: t("marketing.bonuses.stats.invited"), value: stats?.invited },
    {
      icon: Gift,
      label: t("marketing.bonuses.stats.activated"),
      value: stats?.activated,
    },
    {
      icon: Wallet,
      label: t("marketing.bonuses.stats.earned"),
      value: stats ? `${stats.earned} USDT` : undefined,
    },
  ];

  return (
    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
      <h3 className="text-lg font-semibold text-foreground">
        {t("marketing.bonuses.personal.title")}
      </h3>
      <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">
        {t("marketing.bonuses.personal.explanation")}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="font-tabular min-w-0 flex-1 truncate text-base font-semibold text-foreground">
            {referralCode}
          </span>
          <CopyReferralCodeButton
            referralCode={referralCode}
            variant="outline"
            size="sm"
            className="shrink-0 border-border text-primary hover:bg-primary/10 hover:text-primary"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card/80 p-4 text-center"
          >
            <s.icon className="mx-auto h-4 w-4 text-primary" />
            {statsLoading ? (
              <Skeleton className="mx-auto mt-2 h-6 w-16" />
            ) : (
              <div className="font-tabular mt-2 text-xl font-bold text-foreground">
                {s.value ?? 0}
              </div>
            )}
            <div className="mt-1 text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
