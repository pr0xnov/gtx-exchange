"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/skeleton";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  useUpdateProfile,
  useRequestEmailChange,
  type SettingsDto,
} from "@/hooks/use-api";

export function ProfileSection({
  data,
  isLoading,
}: {
  data: SettingsDto | undefined;
  isLoading: boolean;
}) {
  const { t } = useLocale();
  const updateProfile = useUpdateProfile();
  const requestEmailChange = useRequestEmailChange();

  const [firstName, setFirstName] = useState(data?.firstName ?? "");
  const [lastName, setLastName] = useState(data?.lastName ?? "");
  const [initializedFrom, setInitializedFrom] = useState<string | null>(null);

  // Seed the editable fields once real data arrives (initial render has
  // none yet) — re-seeding only when the underlying user id-ish source
  // (email, stable for a given account) actually changes keeps in-progress
  // typing from being clobbered by a background refetch.
  if (data && initializedFrom !== data.email) {
    setInitializedFrom(data.email);
    setFirstName(data.firstName);
    setLastName(data.lastName);
  }

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({ firstName, lastName });
      toast.success(t("settings.toastProfileUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.toastSaveFailed"));
    }
  }

  async function handleRequestEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    try {
      await requestEmailChange.mutateAsync({ newEmail, currentPassword: emailPassword });
      toast.success(t("settings.toastEmailChangeRequested"));
      setShowEmailForm(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : t("settings.toastSaveFailed"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.profile")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">{t("settings.firstName")}</Label>
                <Input
                  id="firstName"
                  className="mt-1.5"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t("settings.lastName")}</Label>
                <Input
                  id="lastName"
                  className="mt-1.5"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("settings.saveChanges")
              )}
            </Button>
          </form>
        )}

        <div className="border-t border-border pt-6">
          <Label>{t("settings.emailCurrentLabel")}</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="text-sm text-foreground">{data?.email}</span>
            {!showEmailForm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEmailForm(true)}
              >
                {t("settings.emailChangeButton")}
              </Button>
            )}
          </div>

          {data?.pendingEmail && (
            <p className="mt-2 text-xs text-muted">
              {t("settings.emailPendingNotice").replace("{email}", data.pendingEmail)}
            </p>
          )}

          {showEmailForm && (
            <form onSubmit={handleRequestEmailChange} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="newEmail">{t("settings.emailNewLabel")}</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    className="mt-1.5"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emailPassword">
                    {t("settings.emailCurrentPasswordLabel")}
                  </Label>
                  <Input
                    id="emailPassword"
                    type="password"
                    className="mt-1.5"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {emailError && <p className="text-xs text-danger">{emailError}</p>}
              <div className="flex gap-3">
                <Button type="submit" size="sm" disabled={requestEmailChange.isPending}>
                  {requestEmailChange.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("settings.emailSendConfirmation")
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEmailForm(false);
                    setEmailError(null);
                  }}
                >
                  {t("settings.emailCancelChange")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
