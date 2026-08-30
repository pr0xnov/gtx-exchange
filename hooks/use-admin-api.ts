"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { refreshAccessToken } from "@/lib/auth/client-refresh";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  isRetry = false
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  // See hooks/use-api.ts's fetchJson for why: access token expired (15m),
  // refresh once and replay this exact request rather than surfacing a
  // false "logged out" for a session whose refresh token is still valid.
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return fetchJson<T>(url, init, true);
  }

  const json: ApiEnvelope<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data;
}

export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "BLOCKED" | "SUSPENDED";
  verification: "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";
  createdAt: string;
  balance: number;
  equity: number;
}

export interface PaginatedUsers {
  users: AdminUserRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useAdminUsers(params: { search?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));

  return useQuery({
    queryKey: ["admin", "users", params.search ?? "", params.page ?? 1],
    queryFn: () => fetchJson<PaginatedUsers>(`/api/admin/users?${query.toString()}`),
  });
}

/** Called only on an explicit "Show" click (SUPER_ADMIN-only server-side —
 *  see app/api/admin/users/[id]/password/route.ts). A useMutation, not a
 *  cached useQuery: every click should be a fresh, individually
 *  audit-logged server round trip, not a silently-reused cached result. */
export function useRevealUserPassword() {
  return useMutation({
    mutationFn: (userId: string) =>
      fetchJson<{ available: boolean; password?: string }>(
        `/api/admin/users/${userId}/password`
      ),
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      fetchJson<{ newPassword: string }>(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      }),
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
    },
  });
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => fetchJson(`/api/admin/users/${id}`),
    enabled: Boolean(id),
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchJson("/api/admin/dashboard"),
    refetchInterval: 15_000,
  });
}

export interface BalanceAdjustmentInput {
  userId: string;
  asset: string;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  reason: string;
}

export function useCreateBalanceAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BalanceAdjustmentInput) =>
      fetchJson("/api/admin/balance-adjustments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "balance-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] });
    },
  });
}

export function useAdminBalanceAdjustments(userId?: string) {
  const query = userId ? `?userId=${userId}` : "";
  return useQuery({
    queryKey: ["admin", "balance-adjustments", userId ?? "all"],
    queryFn: () => fetchJson(`/api/admin/balance-adjustments${query}`),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      status,
      reason,
    }: {
      userId: string;
      status: "ACTIVE" | "BLOCKED" | "SUSPENDED";
      reason?: string;
    }) =>
      fetchJson(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminList(
  key: "deposits" | "withdrawals" | "orders" | "trades" | "transactions",
  page: number
) {
  return useQuery({
    queryKey: ["admin", key, page],
    queryFn: () => fetchJson(`/api/admin/${key}?page=${page}`),
  });
}

export interface AdminVerificationUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";
  documentCount: number;
  updatedAt: string;
}

export function useAdminVerificationUsers() {
  return useQuery({
    queryKey: ["admin", "verification"],
    queryFn: () => fetchJson<AdminVerificationUserRow[]>("/api/admin/verification"),
  });
}

export interface AdminVerificationDetail {
  profile: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    country: string | null;
    dateOfBirth: string | null;
    address: string | null;
  };
  status: "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED";
  documents: {
    id: string;
    type: "IDENTITY" | "PROOF_OF_ADDRESS";
    fileName: string;
    mimeType: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason: string | null;
    uploadedAt: string;
  }[];
}

export function useAdminVerificationDetail(userId: string) {
  return useQuery({
    queryKey: ["admin", "verification", userId],
    queryFn: () =>
      fetchJson<AdminVerificationDetail>(`/api/admin/verification/${userId}`),
    enabled: Boolean(userId),
  });
}

export function useDecideVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      decision,
      reason,
    }: {
      userId: string;
      decision: "APPROVED" | "REJECTED";
      reason?: string;
    }) =>
      fetchJson(`/api/admin/verification/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, reason }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verification"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "verification", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "user", variables.userId] });
    },
  });
}

export interface VerificationProfileFields {
  country?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  email?: string;
}

export function useUpdateVerificationProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fields: VerificationProfileFields) =>
      fetchJson(`/api/admin/verification/${userId}/profile`, {
        method: "PATCH",
        body: JSON.stringify(fields),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verification", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "verification"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user", userId] });
    },
  });
}

export function useDeleteVerificationDocument(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      fetchJson(`/api/verification/documents/${documentId}/file`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verification", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "verification"] });
    },
  });
}

export function useAdminAuditLog(page: number, action?: string) {
  const query = new URLSearchParams({ page: String(page) });
  if (action) query.set("action", action);
  return useQuery({
    queryKey: ["admin", "audit-log", page, action ?? ""],
    queryFn: () => fetchJson(`/api/admin/audit-log?${query.toString()}`),
  });
}

export interface AdminRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "BLOCKED" | "SUSPENDED";
  createdAt: string;
  twoFactorOn: boolean;
}

export function useAdmins() {
  return useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => fetchJson<AdminRow[]>("/api/admin/admins"),
  });
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "USER" | "ADMIN" }) =>
      fetchJson(`/api/admin/admins/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
