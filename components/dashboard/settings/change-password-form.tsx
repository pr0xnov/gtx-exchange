"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import { useChangePassword } from "@/hooks/use-api";

export function ChangePasswordForm() {
  const { t } = useLocale();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordMismatch"));
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword, confirmPassword });
      toast.success(t("settings.toastPasswordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("settings.toastPasswordChangeFailed")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
          <Input
            id="currentPassword"
            type="password"
            className="mt-1.5"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
          <Input
            id="newPassword"
            type="password"
            className="mt-1.5"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">{t("settings.confirmNewPassword")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            className="mt-1.5"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" variant="outline" disabled={changePassword.isPending}>
        {changePassword.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("settings.updatePassword")
        )}
      </Button>
    </form>
  );
}
