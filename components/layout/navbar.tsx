"use client";

import Link from "next/link";
import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  User as UserIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  ShieldCheck,
  Download,
  Settings,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Trading", href: "/trading" },
  { label: "Markets", href: "/markets" },
  { label: "About us", href: "/about" },
  { label: "Tariffs", href: "/tariffs" },
  { label: "Contacts", href: "/contacts" },
];

const ACCOUNT_LINKS = [
  { label: "Account", href: "/account", icon: UserIcon },
  { label: "Deposit", href: "/deposit", icon: ArrowDownToLine },
  { label: "Withdrawal", href: "/withdrawal", icon: ArrowUpFromLine },
  { label: "History", href: "/history", icon: History },
  { label: "Verification", href: "/verification", icon: ShieldCheck },
  { label: "Downloads", href: "/downloads", icon: Download },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

export interface NavbarUser {
  firstName: string;
  lastName: string;
  email: string;
}

function AccountDropdown({ user, onLogout }: { user: NavbarUser; onLogout: () => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none data-[state=open]:border-primary/40">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserIcon className="h-4 w-4" />
          </div>
          <span className="hidden text-foreground sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border border-border bg-card p-1.5 shadow-card"
        >
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium text-foreground">
              {user.firstName} {user.lastName}
            </div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          {ACCOUNT_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <DropdownMenu.Item key={link.href} asChild>
                <Link
                  href={link.href}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors hover:bg-white/5 hover:text-foreground data-[highlighted]:bg-white/5 data-[highlighted]:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </DropdownMenu.Item>
            );
          })}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={onLogout}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger outline-none transition-colors hover:bg-danger/10 data-[highlighted]:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * The single Navbar used on every page (marketing, markets, dashboard,
 * trading). Auth state decides two things: where the logo links (never
 * a hardcoded "/", which used to strand authenticated users on the
 * logged-out marketing page and look like a logout) and whether the
 * right side shows Login/Registration or an Account link.
 */
export function Navbar({ user }: { user: NavbarUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logoHref = user ? "/account" : "/";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("You have been logged out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href={logoHref} className="shrink-0">
            <Logo />
          </Link>
          {user && (
            <div className="hidden lg:flex">
              <AccountDropdown user={user} onLogout={handleLogout} />
            </div>
          )}
          <nav className="hidden items-center gap-7 lg:flex">
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

        <div className="hidden items-center gap-3 lg:flex">
          <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-foreground">
            <Globe className="h-4 w-4" />
            EN
          </button>
          {user && (
            <Button size="sm" asChild>
              <Link href="/deposit">Deposit</Link>
            </Button>
          )}
          {!user && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/register">Registration</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="p-2 text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="mt-2 border-t border-border pt-4">
                  <div className="text-sm font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-muted">{user.email}</div>
                </div>
                <div className="flex flex-col gap-3">
                  {ACCOUNT_LINKS.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-2.5 text-sm text-muted hover:text-foreground"
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 text-sm text-danger"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex gap-3">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button variant="primary" size="sm" className="flex-1" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Registration
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
