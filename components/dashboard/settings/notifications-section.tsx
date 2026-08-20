"use client";

import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/lib/i18n/locale-context";
import { useUpdatePreferences, type UserSettingsDto } from "@/hooks/use-api";

function NotificationRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function NotificationsSection({
  settings,
}: {
  settings: UserSettingsDto | undefined;
}) {
  const { t } = useLocale();
  const updatePreferences = useUpdatePreferences();

  async function toggle(
    key: "notifyEmail" | "notifyPush" | "notifyMarket",
    value: boolean
  ) {
    try {
      await updatePreferences.mutateAsync({ [key]: value });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.toastSaveFailed"));
    }
  }

  if (!settings) return null;

  return (
    <div className="divide-y divide-border">
      <NotificationRow
        label={t("settings.emailNotifications")}
        description={t("settings.emailNotificationsDesc")}
        checked={settings.notifyEmail}
        onCheckedChange={(checked) => toggle("notifyEmail", checked)}
        disabled={updatePreferences.isPending}
      />
      <NotificationRow
        label={t("settings.pushNotifications")}
        description={t("settings.pushNotificationsDesc")}
        checked={settings.notifyPush}
        onCheckedChange={(checked) => toggle("notifyPush", checked)}
        disabled={updatePreferences.isPending}
      />
      <NotificationRow
        label={t("settings.marketAlerts")}
        description={t("settings.marketAlertsDesc")}
        checked={settings.notifyMarket}
        onCheckedChange={(checked) => toggle("notifyMarket", checked)}
        disabled={updatePreferences.isPending}
      />
    </div>
  );
}
