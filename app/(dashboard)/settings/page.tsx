"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-api";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";

function ToggleRow({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((c) => !c)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user, isLoading } = useCurrentUser();
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isLoading ? (
            <>
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </>
          ) : (
            <>
              <div>
                <Label>{t("settings.firstName")}</Label>
                <Input className="mt-1.5" defaultValue={user?.firstName} />
              </div>
              <div>
                <Label>{t("settings.lastName")}</Label>
                <Input className="mt-1.5" defaultValue={user?.lastName} />
              </div>
              <div className="sm:col-span-2">
                <Label>{t("settings.email")}</Label>
                <Input className="mt-1.5" defaultValue={user?.email} disabled />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <Button onClick={() => toast.success(t("settings.toastProfileUpdated"))}>
              {t("settings.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.passwordSecurity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("settings.currentPassword")}</Label>
              <Input type="password" className="mt-1.5" placeholder="••••••••" />
            </div>
            <div>
              <Label>{t("settings.newPassword")}</Label>
              <Input type="password" className="mt-1.5" placeholder="••••••••" />
            </div>
          </div>
          <ToggleRow
            label={t("settings.twoFactorAuth")}
            description={t("settings.twoFactorAuthDesc")}
          />
          <Button
            variant="outline"
            onClick={() => toast.success(t("settings.toastPasswordUpdated"))}
          >
            {t("settings.updatePassword")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ToggleRow
            label={t("settings.emailNotifications")}
            description={t("settings.emailNotificationsDesc")}
            defaultChecked
          />
          <ToggleRow
            label={t("settings.pushNotifications")}
            description={t("settings.pushNotificationsDesc")}
            defaultChecked
          />
          <ToggleRow
            label={t("settings.marketAlerts")}
            description={t("settings.marketAlertsDesc")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.languageTheme")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("settings.language")}</Label>
            <select className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground">
              <option>English</option>
              <option>Русский</option>
              <option>Українська</option>
            </select>
          </div>
          <div>
            <Label>{t("settings.theme")}</Label>
            <select
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground"
              defaultValue="dark"
            >
              <option value="dark">{t("settings.themeDark")}</option>
              <option value="light">{t("settings.themeLight")}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.apiKeys")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">{t("settings.apiKeysDesc")}</p>
          <Button
            variant="outline"
            onClick={() => toast.success(t("settings.toastApiKeyGenerated"))}
          >
            {t("settings.generateNewKey")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
