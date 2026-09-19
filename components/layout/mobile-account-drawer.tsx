"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
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
    <MobileDrawer open={open} onClose={onClose} title={t("nav.accountMenu")} side="right">
      <div className="flex h-full flex-col">
        <div className="border-b border-border pb-4">
          <div className="truncate text-sm font-medium text-foreground">
            {user.firstName} {user.lastName}
          </div>
          <div className="truncate text-xs text-muted">{user.email}</div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 pt-4">
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
