"use client";

import { useCurrentUser, type CurrentUser } from "@/hooks/use-api";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

const VERIFICATION_STATUS_KEY: Record<CurrentUser["verification"], DictionaryKey> = {
  VERIFIED: "verification.statusVerified",
  PENDING: "verification.statusPending",
  REJECTED: "verification.statusRejected",
  UNVERIFIED: "verification.statusUnverified",
};

export function AccountInfoPanel() {
  const { data: user, isLoading } = useCurrentUser();
  const { t } = useLocale();

  const rows = [
    { label: t("account.login"), value: user?.login },
    { label: t("account.email"), value: user?.email },
    { label: t("account.accountType"), value: user?.accountType },
    {
      label: t("account.verification"),
      value: user ? t(VERIFICATION_STATUS_KEY[user.verification]) : undefined,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {t("account.accountInfo")}
      </h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-muted">{row.label}</span>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <span className="font-medium text-foreground">{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
