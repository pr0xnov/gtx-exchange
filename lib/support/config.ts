/**
 * Everything about the /contacts support channels that must come from
 * config rather than be hardcoded in multiple places (see the task spec
 * this was built under). Both fall back to GTX's own real, confirmed
 * support channels rather than staying blank — same pattern
 * hooks/use-live-prices.ts already uses for NEXT_PUBLIC_WS_URL. This
 * fallback (not just the env var) matters here specifically: NEXT_PUBLIC_*
 * values only reach the Next.js *build* itself, and this project's
 * Dockerfile builder stage has no ARG/ENV wiring for either — combined
 * with .env being .dockerignore'd, an env-only value would silently never
 * make it into the built client bundle. The env var still works (and
 * still wins) for any deployment that DOES thread it through a real build
 * pipeline; this default just means the button is never stuck disabled
 * in the meantime.
 */

/** The GTX support Telegram account's t.me link — @gtx_sup is the real,
 *  official GTX support username, not a placeholder. */
export const SUPPORT_TELEGRAM_URL: string | null =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL || "https://t.me/gtx_sup";

/** support@gtx.com is the address already used elsewhere in this app
 *  (email templates' "contact support" footers) — intentionally
 *  configured, not a placeholder. Still routed through an env var so a
 *  real deployment can override it without a second hardcoded copy. */
export const SUPPORT_EMAIL: string | null =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@gtx.com";
