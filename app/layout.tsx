import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getServerLocale } from "@/lib/i18n/get-locale";
import { getServerTheme } from "@/lib/theme/get-theme";

export const metadata: Metadata = {
  title: "GTX — Crypto Trading Exchange",
  description:
    "GTX is a modern crypto spot trading platform. Buy, sell, and manage digital assets with real-time market prices, fast deposits and withdrawals, and a clean, easy-to-use interface.",
  keywords: ["crypto exchange", "spot trading", "buy crypto", "sell crypto", "GTX"],
};

// `viewportFit: "cover"` is what actually lets `env(safe-area-inset-*)`
// resolve to a real value instead of 0 on notch/Dynamic-Island/home-
// indicator phones (Safari ignores the env() vars entirely without it) —
// used by the fixed Navbar/MarketTicker/mobile drawers. Zoom is
// deliberately left enabled (no maximumScale/userScalable: false): this is
// a financial app where users may need to zoom in on amounts/addresses.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
