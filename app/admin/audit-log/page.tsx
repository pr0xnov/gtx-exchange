"use client";

import { useState } from "react";
import { useAdminAuditLog } from "@/hooks/use-admin-api";
import { PaginationFooter } from "@/components/admin/pagination-footer";
import { Skeleton } from "@/components/shared/skeleton";
import { formatDate } from "@/lib/utils";

interface AuditEntry {
  id: string;
  action: string;
  admin: { firstName: string; lastName: string; email: string } | null;
  targetUser: { firstName: string; lastName: string; email: string } | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Read-only by design — there is no delete/edit action anywhere on this
 * page or its backing API route, which is what keeps the Audit Log
 * append-only in practice, not just in name (see the model's own comment
 * in prisma/schema.prisma).
 */
export default function AdminAuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminAuditLog(page);
  const result = data as
    | { entries: AuditEntry[]; page: number; totalPages: number; total: number }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-sm text-muted">
          {result?.total ?? 0} entries — append-only, no admin can edit or delete history
          here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && result?.entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No audit entries yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              result?.entries.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {e.admin ? `${e.admin.firstName} ${e.admin.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {e.action.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {e.targetUser
                      ? `${e.targetUser.firstName} ${e.targetUser.lastName}`
                      : "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3.5 text-xs text-muted">
                    {e.metadata ? JSON.stringify(e.metadata) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{e.ipAddress ?? "—"}</td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(e.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {result && (
        <PaginationFooter
          page={result.page}
          totalPages={result.totalPages}
          onChange={setPage}
        />
      )}
    </div>
  );
}
