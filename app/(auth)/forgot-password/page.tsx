import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function ForgotPasswordPage() {
  const t = await getServerTranslator();

  return (
    <AuthShell
      title={t("auth.forgotPassword.title")}
      footer={
        <Link href="/login" className="text-primary hover:underline">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
