"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useAdmins, useUpdateAdminRole, useAdminUsers } from "@/hooks/use-admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/shared/skeleton";
import { formatDate } from "@/lib/utils";

function PromoteUserPicker({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const { data } = useAdminUsers({ search, page: 1 });
  const updateRole = useUpdateAdminRole();
  const candidates = data?.users.filter((u) => u.role === "USER") ?? [];

  async function handlePromote(userId: string) {
    try {
      await updateRole.mutateAsync({ userId, role: "ADMIN" });
      toast.success("Admin access granted");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Promote a user to admin</h2>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            autoFocus
            placeholder="Search by name or email"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {candidates.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-foreground/5"
            >
              <div className="text-left text-sm">
                <div className="text-foreground">
                  {u.firstName} {u.lastName}
                </div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
              <Button
                size="sm"
                disabled={updateRole.isPending}
                onClick={() => handlePromote(u.id)}
              >
                Promote
              </Button>
            </div>
          ))}
          {search && candidates.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">No matching users.</p>
          )}
        </div>
        <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function AdminsManager() {
  const { data: admins, isLoading } = useAdmins();
  const updateRole = useUpdateAdminRole();
  const [showPicker, setShowPicker] = useState(false);

  async function handleDemote(userId: string) {
    try {
      await updateRole.mutateAsync({ userId, role: "USER" });
      toast.success("Admin access revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admins</h1>
          <p className="mt-1 text-sm text-muted">
            Manage who has ADMIN access. SUPER_ADMIN can only be granted via the
            create-admin script — never through this page.
          </p>
        </div>
        <Button onClick={() => setShowPicker(true)}>Promote user to admin</Button>
      </div>

      {showPicker && <PromoteUserPicker onClose={() => setShowPicker(false)} />}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">2FA</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5" colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!isLoading &&
              admins?.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{a.email}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={a.role === "SUPER_ADMIN" ? "success" : "default"}>
                      {a.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={a.twoFactorOn ? "success" : "pending"}>
                      {a.twoFactorOn ? "Enabled" : "Disabled"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    {a.role === "ADMIN" && (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={updateRole.isPending}
                        onClick={() => handleDemote(a.id)}
                      >
                        Revoke admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
