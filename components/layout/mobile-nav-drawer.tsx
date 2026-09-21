"use client";

import Link from "next/link";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";
import type { DictionaryKey } from "@/lib/i18n/dictionaries";

/**
 * Site navigation only (Wallet/Trading/Markets/About/Analytics/Bonuses/
 * Support) — no account items, no language switcher. A guest additionally
 * sees Login/Register at the bottom, in the same place the previous
 * single combined mobile panel put them, since there's no separate
 * Account drawer for a guest to hold them instead.
 */
export function MobileNavigationDrawer({
  open,
  onClose,
  links,
  isGuest,
}: {
  open: boolean;
  onClose: () => void;
  links: { key: DictionaryKey; href: string }[];
  isGuest: boolean;
}) {
  const { t } = useLocale();

  return (
    <MobileDrawer
      open={open}
      onClose={onClose}
      title={t("nav.siteMenu")}
      side="right"
      header={null}
    >
      {/* No title bar here on purpose — the real page header, still
          visible above this panel, already shows the GTX logo and its
          hamburger button doubles as this drawer's close control (see
          navbar.tsx: it swaps to an × while this is open). A second
          "Меню ×" row here duplicated that closer and confused users into
          seeing two ×'s. */}
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="flex h-11 items-center rounded-lg px-3 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            {t(link.key)}
          </Link>
        ))}
      </nav>

      {isGuest && (
        <div className="mt-6 flex gap-3 border-t border-border pt-6">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/login" onClick={onClose}>
              {t("common.login")}
            </Link>
          </Button>
          <Button variant="primary" size="sm" className="flex-1" asChild>
            <Link href="/register" onClick={onClose}>
              {t("common.register")}
            </Link>
          </Button>
        </div>
      )}
    </MobileDrawer>
  );
}
