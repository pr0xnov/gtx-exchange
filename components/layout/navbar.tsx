"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu,
  X,
  Globe,
  Check,
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
import { NavbarSearch } from "@/components/layout/navbar-search";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { LOCALES, localeLabel, localeName } from "@/lib/i18n/config";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

const NAV_LINKS = [
  { key: "nav.trading", href: "/trading" },
  { key: "nav.markets", href: "/markets" },
  { key: "nav.about", href: "/about" },
  { key: "nav.tariffs", href: "/tariffs" },
  { key: "nav.contacts", href: "/contacts" },
] satisfies { key: DictionaryKey; href: string }[];

// Shown only to an authenticated user, immediately before Trading — guests
// never see it since /wallet has nothing to show them (middleware.ts also
// redirects a guest who navigates there directly).
const WALLET_LINK = { key: "nav.wallet", href: "/wallet" } satisfies {
  key: DictionaryKey;
  href: string;
};

const ACCOUNT_LINKS = [
  { key: "nav.account", href: "/account", icon: UserIcon },
  { key: "nav.deposit", href: "/deposit", icon: ArrowDownToLine },
  { key: "nav.withdrawal", href: "/withdrawal", icon: ArrowUpFromLine },
  { key: "nav.history", href: "/history", icon: History },
  { key: "nav.verification", href: "/verification", icon: ShieldCheck },
  { key: "nav.downloads", href: "/downloads", icon: Download },
  { key: "nav.settings", href: "/settings", icon: Settings },
  { key: "nav.support", href: "/support", icon: LifeBuoy },
] satisfies { key: DictionaryKey; href: string; icon: typeof UserIcon }[];

/**
 * The Language item in the existing Navbar (Globe icon + current locale
 * label) — was a static, non-functional "EN" button; this is the only
 * language switcher in the app, extended in place rather than adding a
 * second one. Same open-on-hover Radix pattern as AccountDropdown right
 * next to it, for the same reason (Content is portaled out of the
 * trigger's DOM subtree, so a plain onMouseLeave on the button alone would
 * close it the instant the cursor crosses into the portaled menu).
 */
function LanguageDropdown() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t("nav.language")}
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted transition-colors hover:text-foreground data-[state=open]:text-foreground"
        >
          <Globe className="h-4 w-4" />
          {localeLabel(locale)}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal forceMount>
        <DropdownMenu.Content
          forceMount
          align="end"
          sideOffset={8}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={cn(
            "z-50 w-40 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-card",
            "transition duration-150 ease-out",
            "data-[state=closed]:pointer-events-none data-[state=closed]:-translate-y-1 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            "data-[state=open]:pointer-events-auto data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
          )}
        >
          {LOCALES.map((l) => (
            <DropdownMenu.Item
              key={l}
              onSelect={() => setLocale(l)}
              className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-muted outline-none transition-colors hover:bg-white/5 hover:text-foreground data-[highlighted]:bg-white/5 data-[highlighted]:text-foreground"
            >
              {localeName(l)}
              {l === locale && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export interface NavbarUser {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Compact icon-only trigger (no name/email in the bar — those still show
 * inside the dropdown's own header) — same dropdown content/links/logout
 * as before, just relocated to the right side after Deposit and given a
 * smaller trigger to match Language/Search/Deposit's height.
 *
 * Opens on hover instead of only on click. Radix's DropdownMenu is
 * click/keyboard-driven by design and portals Content out to
 * document.body, so it isn't a DOM descendant of the trigger — a naive
 * onMouseEnter/onMouseLeave on just the button would close the menu the
 * instant the cursor left the button on its way to the content. Instead,
 * `open` is lifted into local state and both the trigger AND the
 * portaled Content get their own onMouseEnter (cancel any pending close)
 * / onMouseLeave (schedule a close a little in the future) — moving the
 * cursor from one to the other lands inside the other's onMouseEnter
 * before the scheduled close fires, so the menu only actually closes
 * once the cursor has left both. Click-to-open/close still works too,
 * since Radix's own toggle logic flows through the same controlled
 * `open`/`onOpenChange` pair.
 *
 * Content uses `forceMount` so it never mounts/unmounts on open/close —
 * by default Radix only renders Content while open, so every toggle was
 * an instant DOM insert/remove with no way to transition, which is what
 * read as "blinking". With `forceMount` it stays in the DOM permanently
 * (Popper still positions it correctly, just hidden) and visibility is
 * driven purely by the `data-[state]` attribute Radix already toggles,
 * animated with a plain CSS transition (opacity/scale/translate +
 * pointer-events, ~150ms) instead of a mount/unmount jump.
 *
 * `modal={false}` on Root is required alongside `forceMount`: Root's
 * modal Content wraps itself in react-remove-scroll gated on the static
 * `modal` prop, not on live open state — since Content is now always
 * mounted, a modal Root would lock page scroll (wheel-blocked, native
 * scrollbar drag unaffected) site-wide from first render, forever, menu
 * open or not. `modal={false}` disables that lock; outside-click/Escape
 * dismissal still works, it's handled independently of `modal`.
 */
function AccountDropdown({ user, onLogout }: { user: NavbarUser; onLogout: () => void }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t("nav.accountMenu")}
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-primary/40 hover:text-foreground data-[state=open]:border-primary/40 data-[state=open]:text-foreground"
        >
          <UserIcon className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal forceMount>
        <DropdownMenu.Content
          forceMount
          align="end"
          sideOffset={8}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={cn(
            "z-50 w-64 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-card",
            "transition duration-150 ease-out",
            "data-[state=closed]:pointer-events-none data-[state=closed]:-translate-y-1 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            "data-[state=open]:pointer-events-auto data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
          )}
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
                  {t(link.key)}
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
            {t("common.logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * The single Navbar used on every page. Right side order (desktop):
 * Language -> Search -> Deposit -> Account (icon-only) for an
 * authenticated user; Language -> Search -> Login/Registration for a
 * guest. Deposit and Account never show for a guest.
 */
export function Navbar({ user }: { user: NavbarUser | null }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const logoHref = user ? "/account" : "/";
  const navLinks = user ? [WALLET_LINK, ...NAV_LINKS] : NAV_LINKS;

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success(t("nav.logoutSuccess"));
      router.push("/");
      router.refresh();
    } catch {
      toast.error(t("nav.logoutError"));
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href={logoHref} className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
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
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageDropdown />
          <NavbarSearch />
          {user && (
            <>
              <Button size="sm" asChild>
                <Link href="/deposit">{t("nav.deposit")}</Link>
              </Button>
              <AccountDropdown user={user} onLogout={handleLogout} />
            </>
          )}
          {!user && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">{t("common.login")}</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/register">{t("common.register")}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="p-2 text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("nav.toggleMenu")}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
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
                        {t(link.key)}
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
                    {t("common.logout")}
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex gap-3">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    {t("common.login")}
                  </Link>
                </Button>
                <Button variant="primary" size="sm" className="flex-1" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    {t("common.register")}
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
