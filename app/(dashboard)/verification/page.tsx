"use client";

import { VerificationForm } from "@/components/dashboard/verification-form";
import { VerificationStatusPanel } from "@/components/dashboard/verification-status-panel";
import { InfoPanel } from "@/components/dashboard/info-panel";
import { Skeleton } from "@/components/shared/skeleton";
import { useVerificationStatus } from "@/hooks/use-api";
import { useLocale } from "@/lib/i18n/locale-context";

export default function VerificationPage() {
  const { t } = useLocale();
  const { data, isLoading } = useVerificationStatus();

  // A fresh submission (UNVERIFIED) or a rejected one that needs
  // correcting both show the upload form; PENDING/VERIFIED show the
  // read-only status panel instead — this is the only place that
  // decides which view renders, driven entirely by the DB-backed status
  // from GET /api/verification, never local/frontend state.
  const showForm =
    !isLoading && (data?.status === "UNVERIFIED" || data?.status === "REJECTED");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("verification.pageTitle")}
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {t("verification.pageDescription")}
      </p>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {!isLoading && showForm && (
        <>
          {data?.status === "REJECTED" && data.rejectionReason && (
            <div className="mb-6 rounded-2xl border border-danger/30 bg-danger/5 p-4">
              <p className="text-sm font-medium text-danger">
                {t("verification.rejectedMessage")}
              </p>
              <p className="mt-2 text-sm text-foreground">
                <span className="text-xs text-muted">
                  {t("verification.rejectionReasonLabel")}:
                </span>{" "}
                {data.rejectionReason}
              </p>
            </div>
          )}
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
        </>
      )}

      {!isLoading && data && !showForm && <VerificationStatusPanel data={data} />}
    </div>
  );
}
