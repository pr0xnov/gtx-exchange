import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function LoginPage() {
  const t = await getServerTranslator();

  return (
    <AuthShell
      title={t("auth.login.title")}
      footer={
        <>
          {t("auth.login.noAccountPrompt")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("common.register")}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
