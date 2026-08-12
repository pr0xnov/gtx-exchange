// Quote currency (USDT) plus the base currency of every pair in
// lib/binance/client.ts's TRACKED_SYMBOLS. Kept as an explicit list (not
// derived from TRACKED_SYMBOLS at import time) so the set of spot
// currencies is easy to see and doesn't silently change if the tracked
// symbol list ever does.
export const SPOT_CURRENCIES = [
  "USDT",
  "BTC",
  "ETH",
  "BNB",
  "SOL",
  "XRP",
  "ADA",
  "DOGE",
  "LTC",
] as const;

export type SpotCurrency = (typeof SPOT_CURRENCIES)[number];

export function isSpotCurrency(value: string): value is SpotCurrency {
  return (SPOT_CURRENCIES as readonly string[]).includes(value);
}
