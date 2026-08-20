"use client";

import { toast } from "sonner";
import { useAdminVerificationQueue, useDecideVerification } from "@/hooks/use-admin-api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import { formatDate } from "@/lib/utils";

interface DocumentRow {
  id: string;
  type: string;
  fileName: string;
  status: string;
  uploadedAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminVerificationPage() {
  const { data, isLoading } = useAdminVerificationQueue();
  const decide = useDecideVerification();
  const documents = (data as DocumentRow[] | undefined) ?? [];

  async function handleDecision(documentId: string, decision: "APPROVED" | "REJECTED") {
    try {
      await decide.mutateAsync({ documentId, decision });
      toast.success(decision === "APPROVED" ? "Document approved" : "Document rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update document");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification</h1>
        <p className="mt-1 text-sm text-muted">{documents.length} pending documents</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">File</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nothing pending review.
                </td>
              </tr>
            )}
            {!isLoading &&
              documents.map((d) => (
                <tr key={d.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {d.user.firstName} {d.user.lastName}
                    <div className="text-xs text-muted">{d.user.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{d.type.replace("_", " ")}</td>
                  <td className="px-4 py-3.5 text-muted">{d.fileName}</td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(d.uploadedAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={decide.isPending}
                        onClick={() => handleDecision(d.id, "APPROVED")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={decide.isPending}
                        onClick={() => handleDecision(d.id, "REJECTED")}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
