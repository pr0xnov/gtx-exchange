/**
 * Reads a trusted, platform-supplied "which country is this request from"
 * header — used only as a locale-detection fallback (see
 * lib/i18n/config.ts's resolveLocaleFromCountry) when Accept-Language
 * itself didn't resolve to a supported locale. Gated behind the same
 * TRUST_PROXY_HEADERS flag lib/security/client-ip.ts's getTrustedClientIp
 * already uses — this deployment (plain Docker Compose, the `web`
 * service exposed directly per docker-compose.yml) has no reverse proxy
 * in front today, so any of these headers could otherwise be set by the
 * client itself. Flip TRUST_PROXY_HEADERS on only once a real trusted
 * proxy (Vercel, Cloudflare, a configured nginx/load balancer) sits in
 * front and is confirmed to set — and strip any client-supplied copy of
 * — these headers itself. Runs in the Edge middleware runtime as well as
 * Node API routes, so this file deliberately imports nothing beyond the
 * standard Headers API.
 */
const TRUST_PROXY_HEADERS = process.env.TRUST_PROXY_HEADERS === "true";

/** Checked in this order — whichever a real trusted proxy in front of
 *  this deployment actually sets. See this file's own doc comment for
 *  why none of these are read unless TRUST_PROXY_HEADERS is explicitly
 *  enabled. */
const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "cloudfront-viewer-country",
] as const;

export function getTrustedCountry(headers: Headers): string | null {
  if (!TRUST_PROXY_HEADERS) return null;
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim();
    if (value) return value;
  }
  return null;
}
