"use client";

import { useRouter } from "next/navigation";
import { useAdminVerificationUsers } from "@/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/skeleton";
import { formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "danger" | "pending" | "default"> = {
  VERIFIED: "success",
  PENDING: "pending",
  REJECTED: "danger",
  UNVERIFIED: "default",
};

export default function AdminVerificationPage() {
  const router = useRouter();
  const { data, isLoading } = useAdminVerificationUsers();
  const users = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification</h1>
        <p className="mt-1 text-sm text-muted">
          {users.length} users with submitted documents
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Documents</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No verification submissions yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => router.push(`/admin/verification/${u.id}`)}
                  className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-foreground/[0.04]"
                >
                  <td className="px-4 py-3.5 text-foreground">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={STATUS_VARIANT[u.status] ?? "default"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{u.documentCount}</td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(u.updatedAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
