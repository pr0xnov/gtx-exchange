import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function ResetPasswordPage() {
  const t = await getServerTranslator();

  return (
    <AuthShell
      title={t("auth.resetPassword.title")}
      footer={
        <Link href="/login" className="text-primary hover:underline">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
