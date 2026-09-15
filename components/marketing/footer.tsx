import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { getServerTranslator } from "@/lib/i18n/get-locale";

/**
 * Centered, single-row layout (logo -> description -> one evenly-spaced
 * nav row -> a separate legal row) — replaces the old three-column
 * layout (Platform/Company/Legal) that had the logo pinned to the left
 * and duplicated the support destination twice (a "Contacts" link and a
 * separate "Support" link, both pointing at different pages before the
 * old /support page was removed; both now collapse into the one
 * nav.support item below, pointing at /contacts, the single real support
 * page). Mirrors the same public link set as the main Navbar's NAV_LINKS
 * (see components/layout/navbar.tsx) minus Wallet, which is
 * authenticated-only there too.
 */
export async function Footer() {
  const t = await getServerTranslator();

  const NAV_ITEMS = [
    { label: t("nav.trading"), href: "/trading" },
    { label: t("nav.markets"), href: "/markets" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.analytics"), href: "/analytics" },
    { label: t("nav.bonuses"), href: "/bonuses" },
    { label: t("nav.support"), href: "/contacts" },
  ];

  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="container pb-8 pt-14">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <p className="mt-4 w-full text-sm text-muted">
            {t("marketing.footer.description")}
          </p>
        </div>

        <nav className="mt-10 grid grid-cols-2 justify-items-center gap-x-8 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Only remaining footer legal link — Terms of Service was removed
         *  (see this component's own history); /terms itself still exists,
         *  just no longer linked from here. */}
        <div className="mt-5 text-center">
          <Link
            href="/privacy"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("marketing.footer.privacyPolicy")}
          </Link>
        </div>
      </div>

      {/* Bottom row is copyright ONLY — no left/right split, no legal
       *  links here (Privacy Policy lives in the main content area above,
       *  right under the nav). */}
      <div className="border-t border-border py-6">
        <p className="container text-center text-xs text-muted">
          © {new Date().getFullYear()} {t("marketing.footer.copyright")} ·{" "}
          {t("marketing.footer.rightsReserved")}
        </p>
      </div>
    </footer>
  );
}
