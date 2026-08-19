import { VerificationForm } from "@/components/dashboard/verification-form";
import { InfoPanel } from "@/components/dashboard/info-panel";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export default async function VerificationPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("verification.pageTitle")}
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {t("verification.pageDescription")}
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            {t("verification.uploadDocumentsHeading")}
          </h2>
          <VerificationForm />
        </div>
        <InfoPanel
          title={t("verification.infoTitle")}
          items={[
            t("verification.infoIdentityDoc"),
            t("verification.infoProofOfAddress"),
            t("verification.infoValidDocs"),
            t("verification.infoPrivacyPolicy"),
          ]}
        />
      </div>
    </div>
  );
}
