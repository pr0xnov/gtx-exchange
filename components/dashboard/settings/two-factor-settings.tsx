"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  useSetup2FA,
  useEnable2FA,
  useDisable2FA,
  type TwoFaSetupDto,
} from "@/hooks/use-api";

type Mode = "idle" | "setting-up" | "disabling";

export function TwoFactorSettings({ enabled }: { enabled: boolean }) {
  const { t } = useLocale();
  const setup2FA = useSetup2FA();
  const enable2FA = useEnable2FA();
  const disable2FA = useDisable2FA();

  const [mode, setMode] = useState<Mode>("idle");
  const [setupData, setSetupData] = useState<TwoFaSetupDto | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMode("idle");
    setSetupData(null);
    setCode("");
    setError(null);
  }

  async function handleStartSetup() {
    setError(null);
    try {
      const data = await setup2FA.mutateAsync();
      setSetupData(data);
      setMode("setting-up");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("settings.toastTwoFactorSetupFailed")
      );
    }
  }

  async function handleConfirmEnable(e: React.FormEvent) {
    e.preventDefault();
    if (!setupData) return;
    setError(null);
    try {
      await enable2FA.mutateAsync({ setupToken: setupData.setupToken, code });
      toast.success(t("settings.toastTwoFactorEnabled"));
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.toastInvalidCode"));
    }
  }

  async function handleConfirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await disable2FA.mutateAsync({ code });
      toast.success(t("settings.toastTwoFactorDisabled"));
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.toastInvalidCode"));
    }
  }

  if (mode === "setting-up" && setupData) {
    return (
      <div className="space-y-4 rounded-xl border border-border p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.twoFactorSetupTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {t("settings.twoFactorSetupInstructions")}
          </p>
        </div>

        <div className="flex justify-center rounded-xl bg-white p-4">
          {/* Data-URI QR from the server (see /api/settings/2fa/setup) —
              next/image can't optimize a data: URI, so this intentionally
              renders it as a plain <img>. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setupData.qrCodeDataUrl} alt="2FA QR code" width={200} height={200} />
        </div>

        <div className="text-center">
          <p className="text-xs text-muted">{t("settings.twoFactorManualEntry")}</p>
          <p className="font-tabular mt-1 text-sm tracking-wider text-foreground">
            {setupData.secret}
          </p>
        </div>

        <form onSubmit={handleConfirmEnable} className="space-y-3">
          <div>
            <Label htmlFor="totp-enable-code">{t("settings.twoFactorCodeLabel")}</Label>
            <Input
              id="totp-enable-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="font-tabular mt-1.5 text-center text-lg tracking-[0.5em]"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              required
            />
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={enable2FA.isPending || code.length !== 6}
            >
              {enable2FA.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("settings.twoFactorConfirmButton")
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              {t("settings.twoFactorCancelButton")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === "disabling") {
    return (
      <form
        onSubmit={handleConfirmDisable}
        className="space-y-3 rounded-xl border border-border p-4"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("settings.twoFactorDisableTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {t("settings.twoFactorDisableInstructions")}
          </p>
        </div>
        <div>
          <Label htmlFor="totp-disable-code">{t("settings.twoFactorCodeLabel")}</Label>
          <Input
            id="totp-disable-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="font-tabular mt-1.5 text-center text-lg tracking-[0.5em]"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
            required
          />
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={disable2FA.isPending || code.length !== 6}
          >
            {disable2FA.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("settings.twoFactorDisableButton")
            )}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {t("settings.twoFactorCancelButton")}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2.5">
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-primary" />
        ) : (
          <ShieldOff className="h-4 w-4 text-muted" />
        )}
        <div>
          <div className="text-sm font-medium text-foreground">
            {enabled
              ? t("settings.twoFactorEnabledLabel")
              : t("settings.twoFactorDisabledLabel")}
          </div>
          <div className="text-xs text-muted">{t("settings.twoFactorAuthDesc")}</div>
        </div>
      </div>
      {enabled ? (
        <Button variant="outline" size="sm" onClick={() => setMode("disabling")}>
          {t("settings.twoFactorDisableButton")}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartSetup}
          disabled={setup2FA.isPending}
        >
          {setup2FA.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("settings.twoFactorEnableButton")
          )}
        </Button>
      )}
    </div>
  );
}
