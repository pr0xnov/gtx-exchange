import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { getServerTranslator } from "@/lib/i18n/get-locale";

export async function Footer() {
  const t = await getServerTranslator();

  const COLUMNS = [
    {
      title: t("marketing.footer.platform"),
      links: [
        { label: t("nav.trading"), href: "/trading" },
        { label: t("nav.markets"), href: "/markets" },
        { label: t("nav.tariffs"), href: "/tariffs" },
      ],
    },
    {
      title: t("marketing.footer.company"),
      links: [
        { label: t("nav.about"), href: "/about" },
        { label: t("nav.contacts"), href: "/contacts" },
        { label: t("nav.support"), href: "/support" },
      ],
    },
    {
      title: t("marketing.footer.legal"),
      links: [
        { label: t("marketing.footer.privacyPolicy"), href: "/privacy" },
        { label: t("marketing.footer.termsOfService"), href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            {t("marketing.footer.description")}
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted">
        <p>
          © {new Date().getFullYear()} {t("marketing.footer.copyright")}
        </p>
        <p className="mt-1">
          {t("marketing.footer.chartsPoweredBy")}{" "}
          <a
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground hover:underline"
          >
            TradingView Lightweight Charts
          </a>
        </p>
      </div>
    </footer>
  );
}
