"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser, type CurrentUser } from "@/hooks/use-api";
import { Skeleton } from "@/components/shared/skeleton";
import { cn } from "@/lib/utils";
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

  async function handleCopyReferralCode() {
    if (!user) return;
    await navigator.clipboard.writeText(user.referralCode);
    toast.success(t("account.referralCodeCopied"));
  }

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

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("account.twoFactorAuth")}</span>
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <Link
              href="/settings"
              className={cn(
                "font-medium hover:underline",
                user?.twoFactorOn ? "text-primary" : "text-muted"
              )}
            >
              {t(
                user?.twoFactorOn
                  ? "account.twoFactorEnabled"
                  : "account.twoFactorDisabled"
              )}
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">{t("account.referralCode")}</span>
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <button
              type="button"
              onClick={handleCopyReferralCode}
              className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
            >
              <span className="font-tabular">{user?.referralCode}</span>
              <Copy className="h-3.5 w-3.5 text-muted" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
