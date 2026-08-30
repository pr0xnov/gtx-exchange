"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Receipt,
  ShieldCheck,
  ScrollText,
  Settings,
  Wallet,
  UserCog,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { useAdminUnreadCount } from "@/hooks/use-admin-api";

// Orders/Trades/Deposits/Withdrawals/Support were removed from this nav by
// request — their pages/API routes still exist and still work (reachable
// directly by URL, e.g. from a user detail page's own tabs), this only
// drops them from the Admin Panel's left-hand navigation. Dashboard was
// removed the same way — /admin now redirects straight to /admin/users
// (see app/admin/page.tsx) instead of rendering a dashboard.
const NAV_LINKS = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Balance Adjustments", href: "/admin/balance-adjustments", icon: Wallet },
  { label: "Transactions", href: "/admin/transactions", icon: Receipt },
  { label: "Verification", href: "/admin/verification", icon: ShieldCheck },
  { label: "Audit Log", href: "/admin/audit-log", icon: ScrollText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const;

export function AdminSidebar({ role }: { role: "ADMIN" | "SUPER_ADMIN" }) {
  const pathname = usePathname();
  // Total unread Verification/Deposit/Withdrawal requests across every
  // user — shown only next to "Users", the entry point to all three (see
  // hooks/use-admin-api.ts's useAdminUnreadCount and its own doc comment
  // for what "unread" means here).
  const { data: unreadCount } = useAdminUnreadCount();

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
          const active = pathname.startsWith(link.href);
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
              {link.label === "Users" && Boolean(unreadCount) && (
                <Badge
                  variant="count"
                  className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                >
                  {unreadCount}
                </Badge>
              )}
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
