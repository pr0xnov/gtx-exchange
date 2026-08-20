import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getServerLocale } from "@/lib/i18n/get-locale";
import { getServerTheme } from "@/lib/theme/get-theme";

export const metadata: Metadata = {
  title: "GTX — Earn on the Best Financial Assets",
  description:
    "GTX is a training trading platform. Practice trading crypto, forex, stocks, and commodities with real market prices and zero risk using virtual funds.",
  keywords: ["paper trading", "crypto simulator", "demo trading", "GTX"],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // middleware.ts has already resolved (and, on first visit, persisted)
  // the locale cookie by the time this renders, so the very first HTML
  // response is already in the right language — no client-side detection
  // step, so nothing to hydrate-mismatch or flash.
  const locale = await getServerLocale();
  // Theme has no browser-preference detection (unlike locale) — an absent
  // cookie always resolves to "dark", so this is equally flash-free on
  // first paint without needing middleware involvement.
  const theme = await getServerTheme();

  return (
    <html lang={locale} className={theme === "dark" ? "dark" : undefined}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers initialLocale={locale} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
