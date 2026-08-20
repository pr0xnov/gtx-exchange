"use client";

import {
  Users,
  UserCheck,
  Wallet,
  BarChart3,
  ArrowDownToLine,
  ArrowUpFromLine,
  ListOrdered,
  Repeat,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/use-admin-api";
import { StatCard } from "@/components/admin/stat-card";
import { Skeleton } from "@/components/shared/skeleton";
import { formatPrice } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalBalance: number;
  tradingVolume: number;
  completedTrades: number;
  openOrders: number;
  deposits: { count: number; total: number };
  withdrawals: { count: number; total: number };
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboard();
  const stats = data as DashboardStats | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Real-time overview of GTX Exchange — every figure below is a live query, not a
          static snapshot.
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
          />
          <StatCard
            label="Active Users"
            value={stats.activeUsers.toLocaleString()}
            icon={UserCheck}
            tone="primary"
          />
          <StatCard
            label="Total Balance"
            value={`$${formatPrice(stats.totalBalance)}`}
            icon={Wallet}
          />
          <StatCard
            label="Trading Volume"
            value={`$${formatPrice(stats.tradingVolume)}`}
            icon={BarChart3}
          />
          <StatCard
            label="Deposits"
            value={`$${formatPrice(stats.deposits.total)} (${stats.deposits.count})`}
            icon={ArrowDownToLine}
            tone="primary"
          />
          <StatCard
            label="Withdrawals"
            value={`$${formatPrice(stats.withdrawals.total)} (${stats.withdrawals.count})`}
            icon={ArrowUpFromLine}
            tone="danger"
          />
          <StatCard
            label="Open Orders"
            value={stats.openOrders.toLocaleString()}
            icon={ListOrdered}
          />
          <StatCard
            label="Completed Trades"
            value={stats.completedTrades.toLocaleString()}
            icon={Repeat}
          />
        </div>
      )}
    </div>
  );
}
