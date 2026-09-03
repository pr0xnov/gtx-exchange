"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function LoginForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  // Set once /api/auth/login reports the account has 2FA on — the form
  // then swaps to asking for the TOTP code instead of resubmitting
  // email/password. challengeToken proves the password step already
  // passed (see lib/auth/jwt.ts's LoginChallengeTokenPayload); it carries
  // no session by itself.
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  // ADMIN/SUPER_ADMIN land on the Admin Panel instead of the regular
  // Account page — everything else about login (session, cookies, 2FA) is
  // identical for every role; this is purely a post-login destination.
  function redirectAfterLogin(role: string | undefined) {
    toast.success(t("auth.login.welcomeToast"));
    router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin" : "/account");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? t("auth.login.loginFailed"));
        return;
      }

      if (json.data?.requires2FA) {
        setChallengeToken(json.data.challengeToken);
        return;
      }

      redirectAfterLogin(json.data?.user?.role);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? t("auth.login.invalidCode"));
        return;
      }

      redirectAfterLogin(json.data?.user?.role);
    } catch {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  if (challengeToken) {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t("auth.login.twoFactorTitle")}
          </h2>
          <p className="mt-1 text-xs text-muted">{t("auth.login.twoFactorPrompt")}</p>
        </div>

        <div>
          <Label htmlFor="code">{t("auth.login.codeLabel")}</Label>
          <Input
            id="code"
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

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={loading || code.length !== 6}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("auth.login.verifyButton")
          )}
        </Button>

        <button
          type="button"
          onClick={() => {
            setChallengeToken(null);
            setCode("");
            setError(null);
          }}
          className="w-full text-center text-xs text-muted hover:text-foreground"
        >
          {t("auth.login.backToLogin")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">{t("auth.emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          className="mt-1.5"
          value={form.email}
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
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            {t("auth.login.forgotPasswordLink")}
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.login")}
      </Button>
    </form>
  );
}
