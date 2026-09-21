"use client";

import Link from "next/link";
import { LogOut, X } from "lucide-react";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { useLocale } from "@/lib/i18n/locale-context";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";
import type { NavbarUser } from "@/components/layout/navbar";

/**
 * Account-only content (name/email, Account/Deposit/Withdrawal/History/
 * Verification/Settings, then Log out separated at the bottom) — no site
 * navigation, no language switcher (see Settings > Language instead).
 * Never rendered for a guest (Navbar only mounts this when `user` exists).
 */
export function MobileAccountDrawer({
  open,
  onClose,
  user,
  links,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: NavbarUser;
  links: { key: DictionaryKey; href: string; icon: typeof LogOut }[];
  onLogout: () => void;
}) {
  const { t } = useLocale();

  return (
    <MobileDrawer
      open={open}
      onClose={onClose}
      title={t("nav.accountMenu")}
      side="right"
      header={
        // Real user data only — same firstName/lastName/email the desktop
        // AccountDropdown already shows (see navbar.tsx's AccountDropdown),
        // not a separate nickname field (the User model has none). Replaces
        // the old generic "Меню аккаунта ×" bar: this drawer's one and only
        // close button now sits beside the name it actually belongs to.
        <div className="flex shrink-0 items-start justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </div>
            <div className="truncate text-xs text-muted">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex h-11 items-center gap-2.5 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="flex h-11 items-center gap-2.5 rounded-lg border-t border-border px-3 pt-4 text-sm text-danger"
        >
          <LogOut className="h-4 w-4" />
          {t("common.logout")}
        </button>
      </div>
    </MobileDrawer>
  );
}
