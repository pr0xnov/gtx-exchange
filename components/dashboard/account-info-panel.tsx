"use client";

import { useCurrentUser } from "@/hooks/use-api";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

export function AccountInfoPanel() {
  const { data: user, isLoading } = useCurrentUser();
  const { t } = useLocale();

  const rows = [
    { label: t("account.login"), value: user?.login },
    { label: t("account.email"), value: user?.email },
    { label: t("account.accountType"), value: user?.accountType },
    { label: t("account.leverage"), value: user ? `1:${user.leverageMax}` : undefined },
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
