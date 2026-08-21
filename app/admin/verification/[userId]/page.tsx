"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import {
  useAdminVerificationDetail,
  useDecideVerification,
  useUpdateVerificationProfile,
  useDeleteVerificationDocument,
} from "@/hooks/use-admin-api";
import { useCurrentUser } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import { DocumentList } from "@/components/shared/document-list";
import { EditableField, EditableFullNameField } from "@/components/admin/editable-field";
import { formatDateOnly } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "danger" | "pending" | "default"> = {
  VERIFIED: "success",
  PENDING: "pending",
  REJECTED: "danger",
  UNVERIFIED: "default",
};

const DOC_TYPE_LABEL: Record<string, string> = {
  IDENTITY: "Identity document",
  PROOF_OF_ADDRESS: "Proof of address",
};

export default function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { data, isLoading } = useAdminVerificationDetail(userId);
  const { data: currentUser } = useCurrentUser();
  const decide = useDecideVerification();
  const updateProfile = useUpdateVerificationProfile(userId);
  const deleteDocument = useDeleteVerificationDocument(userId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // Editing is SUPER_ADMIN only — enforced for real by the profile
  // endpoint's own requireSuperAdmin() check; this just decides whether
  // to render the Edit controls at all for a plain ADMIN viewing the
  // same page.
  const canEdit = currentUser?.role === "SUPER_ADMIN";

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  async function handleApprove() {
    try {
      await decide.mutateAsync({ userId, decision: "APPROVED" });
      toast.success("Verification approved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    }
  }

  async function handleReject() {
    if (reason.trim().length < 3) {
      toast.error("Please enter a reason for rejection");
      return;
    }
    try {
      await decide.mutateAsync({ userId, decision: "REJECTED", reason: reason.trim() });
      toast.success("Verification rejected");
      setRejecting(false);
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    }
  }

  async function saveField(fields: Parameters<typeof updateProfile.mutateAsync>[0]) {
    await updateProfile.mutateAsync(fields);
    toast.success("Saved");
  }

  async function handleDeleteDocument(documentId: string) {
    try {
      await deleteDocument.mutateAsync(documentId);
      toast.success("Document deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
      throw err;
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{data.profile.fullName}</h1>
          <p className="mt-1 text-sm text-muted">{data.profile.email}</p>
        </div>
        <Badge variant={STATUS_VARIANT[data.status] ?? "default"}>{data.status}</Badge>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Personal information
        </h2>
        {canEdit ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <EditableField
              label="Country"
              value={data.profile.country}
              onSave={(v) => saveField({ country: v })}
            />
            <EditableFullNameField
              firstName={data.profile.firstName}
              lastName={data.profile.lastName}
              onSave={(firstName, lastName) => saveField({ firstName, lastName })}
            />
            <EditableField
              label="Date of birth"
              type="date"
              value={
                data.profile.dateOfBirth ? data.profile.dateOfBirth.slice(0, 10) : null
              }
              onSave={(v) => saveField({ dateOfBirth: v })}
            />
            <EditableField
              label="Address"
              value={data.profile.address}
              onSave={(v) => saveField({ address: v })}
            />
            <EditableField
              label="Email"
              type="email"
              value={data.profile.email}
              onSave={(v) => saveField({ email: v })}
            />
          </dl>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Country" value={data.profile.country} />
            <Field label="Full name" value={data.profile.fullName} />
            <Field
              label="Date of birth"
              value={
                data.profile.dateOfBirth ? formatDateOnly(data.profile.dateOfBirth) : null
              }
            />
            <Field label="Address" value={data.profile.address} />
            <Field label="Email" value={data.profile.email} />
          </dl>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Documents</h2>
        <DocumentList
          documents={data.documents}
          typeLabel={(type) => DOC_TYPE_LABEL[type] ?? type}
          onDelete={canEdit ? handleDeleteDocument : undefined}
        />
        {data.documents.some((d) => d.rejectionReason) && (
          <p className="mt-3 text-xs text-danger">
            Last rejection reason:{" "}
            {data.documents.find((d) => d.rejectionReason)?.rejectionReason}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Verification decision
        </h2>

        {!rejecting ? (
          <div className="flex gap-3">
            <Button variant="primary" disabled={decide.isPending} onClick={handleApprove}>
              Approve
            </Button>
            <Button
              variant="danger"
              disabled={decide.isPending}
              onClick={() => setRejecting(true)}
            >
              Reject
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="reject-reason">
                Reason for rejection
              </label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Explain why this verification is being rejected…"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                disabled={decide.isPending}
                onClick={() => {
                  setRejecting(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button variant="danger" disabled={decide.isPending} onClick={handleReject}>
                {decide.isPending ? "Submitting…" : "Confirm rejection"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}
