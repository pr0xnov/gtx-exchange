/**
 * Client-side counterpart to POST /api/auth/refresh — called by
 * hooks/use-api.ts and hooks/use-admin-api.ts's fetchJson() whenever an
 * API call comes back 401 (the access token, which lives 15m, has
 * expired) so the still-valid refresh token (httpOnly cookie, sent
 * automatically by the browser — never touched from JS here) can renew
 * the session without forcing a re-login.
 *
 * Module-level `inFlight` is the whole fix for "5 requests 401 at once":
 * every fetchJson call that hits a 401 in the same window shares this one
 * promise instead of each firing its own POST /api/auth/refresh. That
 * matters beyond just avoiding redundant requests — /api/auth/refresh
 * rotates the refresh token (revokes the old one, issues a new one) on
 * every successful call, so two concurrent refresh calls would race: the
 * second would present a refresh token the first has already revoked and
 * get a real 401 back, incorrectly logging the user out.
 */
let inFlight: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (!inFlight) {
    inFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}
