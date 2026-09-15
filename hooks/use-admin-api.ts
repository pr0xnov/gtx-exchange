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
  /** Unread Verification/Deposit/Withdrawal requests for this user — see
   *  lib/admin/user-summary.ts's batchUnreadRequestCounts. */
  unreadCount: number;
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

export function useDecideTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      transactionId,
      decision,
    }: {
      transactionId: string;
      userId: string;
      decision: "APPROVE" | "REJECT";
    }) =>
      fetchJson(`/api/admin/transactions/${transactionId}`, {
        method: "PATCH",
        body: JSON.stringify({ decision }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "unread-count"] });
    },
  });
}

/** Total unread Verification/Deposit/Withdrawal requests across every user
 *  — the Admin sidebar's "Users" badge (see components/admin/admin-
 *  sidebar.tsx). Counts requests still PENDING (i.e. still needing an
 *  Approve/Reject decision) — merely viewing a page never changes this,
 *  only a decision does. Polled the same way useAdminDashboard() is, so a
 *  decision made by another admin still clears here within a few seconds
 *  without a manual refresh. */
export function useAdminUnreadCount() {
  return useQuery({
    queryKey: ["admin", "unread-count"],
    queryFn: () =>
      fetchJson<{ total: number }>("/api/admin/unread-count").then((d) => d.total),
    refetchInterval: 15_000,
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
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "unread-count"] });
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

// ---------------------------------------------------------------------------
// SUPPORT
// ---------------------------------------------------------------------------

export interface AdminSupportConversationRow {
  id: string;
  category: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  user: { firstName: string; lastName: string; email: string };
  messageCount: number;
  lastMessage: {
    message: string;
    senderType: "USER" | "ADMIN";
    createdAt: string;
  } | null;
}

/** The Admin Panel's support queue. `status` filters to just OPEN/CLOSED;
 *  omit for everything. Polled the same way useAdminUnreadCount() is, so
 *  a new user message shows up for every admin within a few seconds. */
export function useAdminSupportConversations(status?: "OPEN" | "CLOSED") {
  const query = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: ["admin", "support", "conversations", status ?? "all"],
    queryFn: () =>
      fetchJson<AdminSupportConversationRow[]>(
        `/api/admin/support/conversations${query}`
      ),
    refetchInterval: 15_000,
  });
}

export interface AdminSupportMessageDto {
  id: string;
  senderType: "USER" | "ADMIN";
  message: string;
  createdAt: string;
}

export interface AdminSupportConversationDetail {
  id: string;
  category: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  messages: AdminSupportMessageDto[];
}

/** A single conversation's full thread, for the reply panel. Polled while
 *  open (5s) so a new user message appears without a manual refresh. */
export function useAdminSupportConversation(id: string | null) {
  return useQuery({
    queryKey: ["admin", "support", "conversation", id],
    queryFn: () =>
      fetchJson<AdminSupportConversationDetail>(`/api/admin/support/conversations/${id}`),
    enabled: Boolean(id),
    refetchInterval: id ? 5000 : false,
  });
}

export function useAdminSendSupportMessage(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      fetchJson<AdminSupportMessageDto>(
        `/api/admin/support/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ message }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "conversation", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "conversations"] });
    },
  });
}

export function useAdminSetSupportConversationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "OPEN" | "CLOSED" }) =>
      fetchJson(`/api/admin/support/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "support", "conversation", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "conversations"] });
    },
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
