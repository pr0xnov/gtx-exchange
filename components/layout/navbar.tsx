"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe, ChevronDown, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
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

export interface NavbarUser {
  firstName: string;
  lastName: string;
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
  const logoHref = user ? "/account" : "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href={logoHref} className="shrink-0">
            <Logo />
          </Link>
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
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="hidden text-foreground sm:inline">
                {user.firstName} {user.lastName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </Link>
          ) : (
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
            <div className="mt-2 flex gap-3">
              {user ? (
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/account" onClick={() => setOpen(false)}>
                    Account
                  </Link>
                </Button>
              ) : (
                <>
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
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
