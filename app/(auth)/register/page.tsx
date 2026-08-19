import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function RegisterPage() {
  const t = await getServerTranslator();

  return (
    <AuthShell
      title={t("auth.register.title")}
      footer={
        <>
          {t("auth.register.haveAccountPrompt")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("common.login")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
