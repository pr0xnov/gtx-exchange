"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  agreeToTerms?: string;
  referralCode?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreeToTerms: false,
    referralCode: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.details) {
          const fieldErrors: FieldErrors = {};
          for (const [key, msgs] of Object.entries(json.details)) {
            const raw = (msgs as string[])[0];
            // The server sends a stable sentinel (not a display string)
            // for this one field so the client can show it in the
            // viewer's own locale rather than a hardcoded server string.
            fieldErrors[key as keyof FieldErrors] =
              key === "referralCode" && raw === "INVALID_REFERRAL_CODE"
                ? t("auth.register.invalidReferralCode")
                : raw;
          }
          setErrors(fieldErrors);
        } else {
          toast.error(json.error ?? t("auth.register.registrationFailed"));
        }
        return;
      }

      toast.success(t("auth.register.successToast"));
      router.push("/account");
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="firstName">{t("auth.register.firstNameLabel")}</Label>
          <Input
            id="firstName"
            className="mt-1.5"
            value={form.firstName}
            error={errors.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">{t("auth.register.lastNameLabel")}</Label>
          <Input
            id="lastName"
            className="mt-1.5"
            value={form.lastName}
            error={errors.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">{t("auth.emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          className="mt-1.5"
          value={form.email}
          error={errors.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">{t("auth.passwordLabel")}</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="referralCode">{t("auth.register.referralCodeLabel")}</Label>
        <Input
          id="referralCode"
          className="mt-1.5"
          placeholder={t("auth.register.referralCodePlaceholder")}
          value={form.referralCode}
          error={errors.referralCode}
          onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
        />
      </div>

      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="agree"
          checked={form.agreeToTerms}
          onCheckedChange={(checked) =>
            setForm({ ...form, agreeToTerms: checked === true })
          }
        />
        <Label htmlFor="agree" className="cursor-pointer font-normal leading-snug">
          {t("auth.register.agreeToTermsPrefix")}{" "}
          <a href="/privacy" className="text-primary hover:underline">
            {t("auth.register.privacyPolicy")}
          </a>
        </Label>
      </div>
      {errors.agreeToTerms && (
        <p className="text-xs text-danger">{errors.agreeToTerms}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("auth.register.submitButton")
        )}
      </Button>
    </form>
  );
}
