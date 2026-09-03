import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The account's main currency (Balance/Equity/Profit, asset value, PnL —
 *  every figure this platform's Spot ledger is denominated in; see
 *  app/api/account/summary/route.ts). Every existing caller already only
 *  ever passed a Spot-USDT-derived number here, so this is a display fix,
 *  not a behavior change: was rendered as Intl "$X.XX" (via `currency:
 *  "USD"`), which is numerically identical to USDT on this platform but
 *  mislabeled it as US dollars. Trims trailing zeros the same way
 *  formatAmount() already does elsewhere (e.g. "100.5", not "100.50"). */
export function formatCurrency(value: number | string): string {
  return `${formatAmount(value, 2)} USDT`;
}

export function formatPrice(value: number | string, decimals = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Trims trailing zeros for a crypto-precision decimal amount for display
 *  only — e.g. "1000.00000000" -> "1,000", "1.50000000" -> "1.5",
 *  "0.01000000" -> "0.01". Never used for the stored/DB value or any
 *  financial calculation, only for rendering one on screen. */
export function formatAmount(value: number | string, maxDecimals = 8): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/** Compact $-notation for large numbers (e.g. "$4.21B", "$382.5M") — used
 *  for the /analytics "highest activity" volume figures, which are a
 *  computed price × base-asset-volume USD-equivalent (see quoteVolumeOf in
 *  lib/markets/derive.ts), not a separately-fetched quote-volume field
 *  (Binance's ticker payload only ever exposes base-asset volume in this
 *  codebase — see lib/binance/client.ts). */
export function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** For calendar-only dates (currently just date of birth) — deliberately
 *  does NOT go through Intl.DateTimeFormat with the viewer's local
 *  timezone the way formatDate() does. A date of birth is stored as a
 *  UTC midnight timestamp (e.g. "1988-07-22T00:00:00.000Z"); formatting
 *  that through the browser's local timezone can roll it back/forward a
 *  day (and, since formatDate() also renders hour/minute, show a
 *  misleading time-of-day on what's actually just a date). Extracting
 *  Y-M-D straight from the ISO string sidesteps timezone conversion
 *  entirely, so the calendar date never shifts no matter where it's
 *  viewed from. */
export function formatDateOnly(date: Date | string): string {
  const iso = typeof date === "string" ? date : date.toISOString();
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export function generateLoginId(): string {
  return String(Math.floor(10_000_000 + Math.random() * 89_999_999));
}
