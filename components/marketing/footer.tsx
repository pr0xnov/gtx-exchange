import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Trading", href: "/trading" },
      { label: "Markets", href: "/markets" },
      { label: "Tariffs", href: "/tariffs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contacts", href: "/contacts" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            GTX is a paper-trading education platform. All balances are virtual and
            all trades are simulated — no real funds are ever at risk.
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
        © {new Date().getFullYear()} GTX. Virtual trading simulator for educational
        purposes only.
      </div>
    </footer>
  );
}
