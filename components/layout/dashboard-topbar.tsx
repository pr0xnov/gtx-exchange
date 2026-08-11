"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, User as UserIcon } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Trading", href: "/trading" },
  { label: "Markets", href: "/markets" },
  { label: "Withdrawal", href: "/withdrawal" },
  { label: "Tariffs", href: "/tariffs" },
  { label: "Contacts", href: "/contacts" },
];

export function DashboardTopbar({ userInitials }: { userInitials?: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-10">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors",
                pathname.startsWith(link.href)
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <Link
        href="/account"
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserIcon className="h-4 w-4" />
        </div>
        <span className="hidden text-foreground sm:inline">
          {userInitials ?? "Account"}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </Link>
    </header>
  );
}
