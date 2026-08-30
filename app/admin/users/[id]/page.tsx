"use client";

import { use, useState } from "react";
import type { ReactNode } from "react";
import {
  useAdminUserDetail,
  useUpdateUserStatus,
  useDecideTransaction,
} from "@/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import { BalanceAdjustmentForm } from "@/components/admin/balance-adjustment-form";
import { cn, formatPrice, formatAmount, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const TABS = [
  "Profile",
  "Wallet",
  "Balances",
  "Orders",
  "Trades",
  "Deposits",
  "Withdrawals",
  "Verification",
  "Security",
  "Activity",
] as const;
type Tab = (typeof TABS)[number];

const STATUS_VARIANT: Record<string, "success" | "danger" | "pending"> = {
  ACTIVE: "success",
  BLOCKED: "danger",
  SUSPENDED: "pending",
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useAdminUserDetail(id);
  const [tab, setTab] = useState<Tab>("Profile");
  const [adjustment, setAdjustment] = useState<"CREDIT" | "DEBIT" | null>(null);
  const updateStatus = useUpdateUserStatus();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const {
    profile,
    wallet,
    unread,
    spotWallets,
    orders,
    trades,
    transactions,
    verification,
    security,
    activity,
  } = data as {
    profile: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      pendingEmail: string | null;
      login: string;
      role: string;
      status: "ACTIVE" | "BLOCKED" | "SUSPENDED";
      accountType: string;
      leverageMax: number;
      createdAt: string;
    };
    wallet: { balance: number; equity: number };
    unread: { deposits: number; withdrawals: number; verification: 0 | 1 };
    spotWallets: { currency: string; balance: string; locked: string }[];
    orders: {
      id: string;
      symbol: string;
      side: string;
      type: string;
      price: string;
      quantity: string;
      filledQuantity: string;
      status: string;
      createdAt: string;
    }[];
    trades: (typeof orders extends (infer T)[] ? T : never)[];
    transactions: {
      id: string;
      type: string;
      asset: string;
      amount: string;
      direction: string | null;
      status: string;
      createdAt: string;
    }[];
    verification: {
      status: string;
      documents: {
        id: string;
        type: string;
        status: string;
        fileName: string;
        uploadedAt: string;
      }[];
    };
    security: {
      twoFactorOn: boolean;
      language: string;
      theme: string;
      notifyEmail: boolean;
      notifyPush: boolean;
      notifyMarket: boolean;
    };
    activity: {
      id: string;
      action: string;
      admin: { firstName: string; lastName: string; email: string } | null;
      metadata: unknown;
      ipAddress: string | null;
      createdAt: string;
    }[];
  };

  const userName = `${profile.firstName} ${profile.lastName}`;
  const deposits = transactions.filter((t) => t.type === "DEPOSIT");
  const withdrawals = transactions.filter((t) => t.type === "WITHDRAWAL");

  async function handleStatusChange(status: "ACTIVE" | "BLOCKED" | "SUSPENDED") {
    try {
      await updateStatus.mutateAsync({ userId: id, status });
      toast.success(`Status changed to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{userName}</h1>
          <p className="mt-1 text-sm text-muted">{profile.email}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => setAdjustment("CREDIT")}>
            Add Balance
          </Button>
          <Button variant="danger" onClick={() => setAdjustment("DEBIT")}>
            Remove Balance
          </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto border-b border-border">
        {TABS.map((tabName) => {
          const tabUnreadCount =
            tabName === "Deposits"
              ? unread.deposits
              : tabName === "Withdrawals"
                ? unread.withdrawals
                : tabName === "Verification"
                  ? unread.verification
                  : 0;
          return (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors",
                tab === tabName
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {tabName}
              {tabUnreadCount > 0 && (
                <Badge
                  variant="count"
                  className="rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                >
                  {tabUnreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {tab === "Profile" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" value={profile.firstName} />
            <Field label="Last name" value={profile.lastName} />
            <Field label="Email" value={profile.email} />
            {profile.pendingEmail && (
              <Field label="Pending email" value={profile.pendingEmail} />
            )}
            <Field label="Login ID" value={profile.login} />
            <Field label="Role" value={profile.role} />
            <Field label="Account type" value={profile.accountType} />
            <Field label="Leverage max" value={`${profile.leverageMax}x`} />
            <Field label="Created" value={formatDate(profile.createdAt)} />
            <div>
              <dt className="text-xs text-muted">Status</dt>
              <dd className="mt-1 flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[profile.status]}>{profile.status}</Badge>
              </dd>
            </div>
          </dl>

          {profile.role === "USER" && (
            <div className="mt-6 flex gap-2 border-t border-border pt-4">
              {(["ACTIVE", "BLOCKED", "SUSPENDED"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={profile.status === s ? "primary" : "outline"}
                  disabled={updateStatus.isPending || profile.status === s}
                  onClick={() => handleStatusChange(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Wallet" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs text-muted">Balance</div>
            <div className="font-tabular mt-1 text-2xl font-bold text-foreground">
              ${formatPrice(wallet.balance)}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs text-muted">Equity</div>
            <div className="font-tabular mt-1 text-2xl font-bold text-foreground">
              ${formatPrice(wallet.equity)}
            </div>
          </div>
        </div>
      )}

      {tab === "Balances" && (
        <SimpleTable
          columns={["Currency", "Balance", "Locked"]}
          rows={spotWallets.map((w) => [
            w.currency,
            formatAmount(w.balance),
            formatAmount(w.locked),
          ])}
          empty="No spot wallets."
        />
      )}

      {tab === "Orders" && (
        <SimpleTable
          columns={[
            "Symbol",
            "Side",
            "Type",
            "Price",
            "Quantity",
            "Filled",
            "Status",
            "Created",
          ]}
          rows={orders.map((o) => [
            o.symbol,
            o.side,
            o.type,
            formatPrice(Number(o.price), 4),
            formatPrice(Number(o.quantity), 8),
            formatPrice(Number(o.filledQuantity), 8),
            o.status,
            formatDate(o.createdAt),
          ])}
          empty="No orders."
        />
      )}

      {tab === "Trades" && (
        <SimpleTable
          columns={["Symbol", "Side", "Price", "Filled Qty", "Created"]}
          rows={trades.map((o) => [
            o.symbol,
            o.side,
            formatPrice(Number(o.price), 4),
            formatPrice(Number(o.filledQuantity), 8),
            formatDate(o.createdAt),
          ])}
          empty="No trades yet."
        />
      )}

      {tab === "Deposits" && (
        <SimpleTable
          columns={["Asset", "Amount", "Status", "Date", "Actions"]}
          rows={deposits.map((t) => [
            t.asset,
            formatAmount(t.amount),
            t.status,
            formatDate(t.createdAt),
            t.status === "PENDING" ? (
              <TransactionDecisionButtons key={t.id} transactionId={t.id} userId={id} />
            ) : (
              "—"
            ),
          ])}
          empty="No deposits."
        />
      )}

      {tab === "Withdrawals" && (
        <SimpleTable
          columns={["Asset", "Amount", "Status", "Date", "Actions"]}
          rows={withdrawals.map((t) => [
            t.asset,
            formatAmount(t.amount),
            t.status,
            formatDate(t.createdAt),
            t.status === "PENDING" ? (
              <TransactionDecisionButtons key={t.id} transactionId={t.id} userId={id} />
            ) : (
              "—"
            ),
          ])}
          empty="No withdrawals."
        />
      )}

      {tab === "Verification" && (
        <div className="space-y-4">
          <Badge variant={verification.status === "VERIFIED" ? "success" : "pending"}>
            {verification.status}
          </Badge>
          <SimpleTable
            columns={["Type", "File", "Status", "Uploaded"]}
            rows={verification.documents.map((d) => [
              d.type,
              d.fileName,
              d.status,
              formatDate(d.uploadedAt),
            ])}
            empty="No documents submitted."
          />
        </div>
      )}

      {tab === "Security" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="2FA" value={security.twoFactorOn ? "Enabled" : "Disabled"} />
            <Field label="Language" value={security.language.toUpperCase()} />
            <Field label="Theme" value={security.theme} />
            <Field
              label="Email notifications"
              value={security.notifyEmail ? "On" : "Off"}
            />
            <Field
              label="Push notifications"
              value={security.notifyPush ? "On" : "Off"}
            />
            <Field label="Market alerts" value={security.notifyMarket ? "On" : "Off"} />
          </dl>
        </div>
      )}

      {tab === "Activity" && (
        <SimpleTable
          columns={["Action", "Admin", "Date"]}
          rows={activity.map((a) => [
            a.action,
            a.admin ? `${a.admin.firstName} ${a.admin.lastName}` : "—",
            formatDate(a.createdAt),
          ])}
          empty="No admin activity recorded for this user."
        />
      )}

      {adjustment && (
        <BalanceAdjustmentForm
          userId={id}
          userName={userName}
          direction={adjustment}
          onClose={() => setAdjustment(null)}
        />
      )}
    </div>
  );
}

function TransactionDecisionButtons({
  transactionId,
  userId,
}: {
  transactionId: string;
  userId: string;
}) {
  const decide = useDecideTransaction();

  async function handleDecide(decision: "APPROVE" | "REJECT") {
    try {
      await decide.mutateAsync({ transactionId, userId, decision });
      toast.success(decision === "APPROVE" ? "Approved" : "Rejected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update transaction");
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="primary"
        disabled={decide.isPending}
        onClick={() => handleDecide("APPROVE")}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={decide.isPending}
        onClick={() => handleDecide("REJECT")}
      >
        Reject
      </Button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function SimpleTable({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: ReactNode[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="font-tabular px-4 py-3 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
