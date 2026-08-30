"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAdminUsers } from "@/hooks/use-admin-api";
import { useCurrentUser } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/skeleton";
import { UserPasswordCell } from "@/components/admin/user-password-cell";
import { formatPrice, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "danger" | "pending"> = {
  ACTIVE: "success",
  BLOCKED: "danger",
  SUSPENDED: "pending",
};

const VERIFICATION_VARIANT: Record<string, "success" | "danger" | "pending" | "default"> =
  {
    VERIFIED: "success",
    REJECTED: "danger",
    PENDING: "pending",
    UNVERIFIED: "default",
  };

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers({ search, page });
  const { data: currentUser } = useCurrentUser();
  const canRevealPasswords = currentUser?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted">{data?.total ?? 0} accounts</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="Search by name, email, or login ID"
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Password</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 text-right font-medium">Equity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Verification</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3.5" colSpan={8}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && data?.users.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No users found.
                </td>
              </tr>
            )}

            {!isLoading &&
              data?.users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                  className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-foreground/[0.04]"
                >
                  <td className="px-4 py-3.5 text-foreground">
                    {u.firstName} {u.lastName}
                    {u.role !== "USER" && (
                      <Badge variant="default" className="ml-2">
                        {u.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    <span className="inline-flex items-center gap-2">
                      {u.email}
                      {u.unreadCount > 0 && (
                        <Badge
                          variant="count"
                          className="rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                        >
                          {u.unreadCount}
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <UserPasswordCell
                      userId={u.id}
                      userLabel={`${u.firstName} ${u.lastName}`}
                      canReveal={canRevealPasswords}
                    />
                  </td>
                  <td className="font-tabular px-4 py-3.5 text-right text-foreground">
                    ${formatPrice(u.balance)}
                  </td>
                  <td className="font-tabular px-4 py-3.5 text-right text-foreground">
                    ${formatPrice(u.equity)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={STATUS_VARIANT[u.status] ?? "default"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={VERIFICATION_VARIANT[u.verification] ?? "default"}>
                      {u.verification}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
              className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
