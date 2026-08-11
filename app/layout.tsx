import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GTX — Earn on the Best Financial Assets",
  description:
    "GTX is a training trading platform. Practice trading crypto, forex, stocks, and commodities with real market prices and zero risk using virtual funds.",
  keywords: ["paper trading", "crypto simulator", "demo trading", "GTX"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
