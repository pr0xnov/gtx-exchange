"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  ListOrdered,
  Repeat,
  Receipt,
  ShieldCheck,
  LifeBuoy,
  ScrollText,
  Settings,
  Wallet,
  UserCog,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Balance Adjustments", href: "/admin/balance-adjustments", icon: Wallet },
  { label: "Deposits", href: "/admin/deposits", icon: ArrowDownToLine },
  { label: "Withdrawals", href: "/admin/withdrawals", icon: ArrowUpFromLine },
  { label: "Orders", href: "/admin/orders", icon: ListOrdered },
  { label: "Trades", href: "/admin/trades", icon: Repeat },
  { label: "Transactions", href: "/admin/transactions", icon: Receipt },
  { label: "Verification", href: "/admin/verification", icon: ShieldCheck },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminSidebar({ role }: { role: "ADMIN" | "SUPER_ADMIN" }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <Logo />
        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}

        {role === "SUPER_ADMIN" && (
          <Link
            href="/admin/admins"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin/admins")
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <UserCog className="h-4 w-4" />
            Admins
          </Link>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/account"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-foreground/5 hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Exit to site
        </Link>
      </div>
    </aside>
  );
}
