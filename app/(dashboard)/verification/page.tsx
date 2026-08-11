import { VerificationForm } from "@/components/dashboard/verification-form";
import { InfoPanel } from "@/components/dashboard/info-panel";

export default function VerificationPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Account verification</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        To comply with international regulations, please verify your account by
        uploading the documents below.
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Upload documents
          </h2>
          <VerificationForm />
        </div>
        <InfoPanel
          title="Required documents"
          items={[
            "Identity document (passport, ID card or driver's license).",
            "Proof of address (utility bill, bank statement or similar).",
            "All documents must be valid and clearly visible.",
            "We process your data in accordance with our Privacy Policy.",
          ]}
        />
      </div>
    </div>
  );
}
