"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAdminBalanceAdjustments, useAdminUsers } from "@/hooks/use-admin-api";
import { BalanceAdjustmentForm } from "@/components/admin/balance-adjustment-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";

interface AdjustmentRow {
  id: string;
  asset: string;
  amount: string;
  direction: "CREDIT" | "DEBIT";
  reason: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  admin: { firstName: string; lastName: string; email: string };
}

function NewAdjustmentPicker({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [direction, setDirection] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const { data } = useAdminUsers({ search, page: 1 });

  if (selected) {
    return (
      <BalanceAdjustmentForm
        userId={selected.id}
        userName={selected.name}
        direction={direction}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Select a user</h2>
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
          {data?.users.map((u) => (
            <button
              key={u.id}
              onClick={() =>
                setSelected({ id: u.id, name: `${u.firstName} ${u.lastName}` })
              }
              className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/5"
            >
              <span className="text-foreground">
                {u.firstName} {u.lastName}
              </span>
              <span className="text-xs text-muted">{u.email}</span>
            </button>
          ))}
          {search && data?.users.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">No matching users.</p>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-muted">Action:</span>
          <Button
            size="sm"
            variant={direction === "CREDIT" ? "primary" : "outline"}
            onClick={() => setDirection("CREDIT")}
          >
            Add Balance
          </Button>
          <Button
            size="sm"
            variant={direction === "DEBIT" ? "danger" : "outline"}
            onClick={() => setDirection("DEBIT")}
          >
            Remove Balance
          </Button>
        </div>
        <Button variant="ghost" className="mt-4 w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function AdminBalanceAdjustmentsPage() {
  const { data, isLoading } = useAdminBalanceAdjustments();
  const adjustments = (data as AdjustmentRow[] | undefined) ?? [];
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Balance Adjustments</h1>
          <p className="mt-1 text-sm text-muted">
            Every manual credit/debit — each one is a real Transaction + Audit Log entry.
          </p>
        </div>
        <Button onClick={() => setShowPicker(true)}>New Adjustment</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Date</th>
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
            {!isLoading && adjustments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No balance adjustments yet.
                </td>
              </tr>
            )}
            {!isLoading &&
              adjustments.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {a.user.firstName} {a.user.lastName}
                    <div className="text-xs text-muted">{a.user.email}</div>
                  </td>
                  <td
                    className={`font-tabular px-4 py-3.5 text-right ${
                      a.direction === "CREDIT" ? "text-primary" : "text-danger"
                    }`}
                  >
                    {a.direction === "CREDIT" ? "+" : "-"}
                    {formatPrice(Number(a.amount), 8)} {a.asset}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{a.reason}</td>
                  <td className="px-4 py-3.5 text-muted">
                    {a.admin.firstName} {a.admin.lastName}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showPicker && <NewAdjustmentPicker onClose={() => setShowPicker(false)} />}

      <p className="text-xs text-muted">
        Tip: you can also add/remove balance directly from a{" "}
        <Link href="/admin/users" className="text-primary hover:underline">
          user&apos;s detail page
        </Link>
        .
      </p>
    </div>
  );
}
