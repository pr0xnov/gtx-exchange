"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSettings } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";
import { ProfileSection } from "@/components/dashboard/settings/profile-section";
import { ChangePasswordForm } from "@/components/dashboard/settings/change-password-form";
import { TwoFactorSettings } from "@/components/dashboard/settings/two-factor-settings";
import { NotificationsSection } from "@/components/dashboard/settings/notifications-section";
import { PreferencesSection } from "@/components/dashboard/settings/preferences-section";

/** Handles the redirect from GET /api/settings/email/confirm (a person
 *  clicking the link in their inbox, not a client-side navigation) —
 *  shows the outcome as a toast once, then strips the query param so a
 *  refresh doesn't re-show it. */
function useEmailChangeFeedback() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("emailChange");
    if (!status) return;

    if (status === "confirmed") toast.success(t("settings.toastEmailChangeConfirmed"));
    else if (status === "expired") toast.error(t("settings.toastEmailChangeExpired"));
    else if (status === "invalid") toast.error(t("settings.toastEmailChangeInvalid"));

    router.replace("/settings");
    // Runs once per landing with the param present — searchParams/router
    // are stable-enough refs from Next's own hooks, re-running this on
    // every render would just re-strip an already-stripped URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
}

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const { t } = useLocale();
  useEmailChangeFeedback();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      <ProfileSection data={data} isLoading={isLoading} />

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.passwordSecurity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChangePasswordForm />
          <div className="border-t border-border pt-1">
            <TwoFactorSettings enabled={data?.settings.twoFactorOn ?? false} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationsSection settings={data?.settings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.languageTheme")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesSection />
        </CardContent>
      </Card>
    </div>
  );
}
