"use client";

import { Badge } from "@/components/ui/badge";
import { DocumentList } from "@/components/shared/document-list";
import { useLocale } from "@/lib/i18n/locale-context";
import { formatDateOnly } from "@/lib/utils";
import type { VerificationStatusDto } from "@/hooks/use-api";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

const STATUS_KEY: Record<VerificationStatusDto["status"], DictionaryKey> = {
  VERIFIED: "verification.statusVerified",
  PENDING: "verification.statusPending",
  REJECTED: "verification.statusRejected",
  UNVERIFIED: "verification.statusUnverified",
};

const STATUS_VARIANT: Record<
  VerificationStatusDto["status"],
  "success" | "danger" | "pending" | "default"
> = {
  VERIFIED: "success",
  PENDING: "pending",
  REJECTED: "danger",
  UNVERIFIED: "default",
};

/** Shown once a user has submitted at least one verification (PENDING,
 *  VERIFIED, or REJECTED) — the read-only "here's what we have on file"
 *  view. UNVERIFIED (and REJECTED, to allow a correction) instead render
 *  the submit form (see the page), not this panel. */
export function VerificationStatusPanel({ data }: { data: VerificationStatusDto }) {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {t("verification.personalInfoHeading")}
          </h2>
          <Badge variant={STATUS_VARIANT[data.status]}>
            {t(STATUS_KEY[data.status])}
          </Badge>
        </div>

        {data.status === "PENDING" && (
          <p className="mb-4 text-sm text-muted">{t("verification.pendingMessage")}</p>
        )}
        {data.status === "REJECTED" && data.rejectionReason && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-3">
            <p className="text-xs font-medium text-danger">
              {t("verification.rejectionReasonLabel")}
            </p>
            <p className="mt-1 text-sm text-foreground">{data.rejectionReason}</p>
          </div>
        )}

        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label={t("verification.countryLabel")} value={data.profile.country} />
          <Field label={t("account.email")} value={data.profile.email} />
          <Field
            label={t("verification.dateOfBirthLabel")}
            value={
              data.profile.dateOfBirth ? formatDateOnly(data.profile.dateOfBirth) : null
            }
          />
          <Field label={t("verification.addressLabel")} value={data.profile.address} />
          <Field label={t("verification.fullNameLabel")} value={data.profile.fullName} />
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {t("verification.documentsHeading")}
        </h2>
        <DocumentList
          documents={data.documents}
          typeLabel={(type) =>
            type === "IDENTITY"
              ? t("verification.identityDocumentLabel")
              : t("verification.proofOfAddressLabel")
          }
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
