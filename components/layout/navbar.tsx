"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";

const NAV_LINKS = [
  { label: "Trading", href: "/trading" },
  { label: "Markets", href: "/markets" },
  { label: "About us", href: "/about" },
  { label: "Tariffs", href: "/tariffs" },
  { label: "Contacts", href: "/contacts" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/register">Registration</Link>
          </Button>
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
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="primary" size="sm" className="flex-1" asChild>
                <Link href="/register">Registration</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
