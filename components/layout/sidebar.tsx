"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Download,
  Settings,
  LifeBuoy,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV_ITEMS = [
  { label: "Account", href: "/account", icon: User },
  { label: "Deposit", href: "/deposit", icon: ArrowDownToLine },
  { label: "Withdrawal", href: "/withdrawal", icon: ArrowUpFromLine },
  { label: "History", href: "/history", icon: History },
  { label: "Verification", href: "/verification", icon: ShieldCheck },
  { label: "Downloads", href: "/downloads", icon: Download },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("You have been logged out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/40 md:flex">
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
