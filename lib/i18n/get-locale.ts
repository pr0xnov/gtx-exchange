import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, Locale, isLocale, resolveAutoLocale } from "./config";
import { getTrustedCountry } from "@/lib/security/geo";
import { DictionaryKey, translate } from "./dictionaries";

/**
 * Server Components: reads the locale cookie (set by middleware.ts on
 * first visit, or by the manual switcher — see locale-context.tsx, or
 * synced from a returning user's saved account language at login — see
 * lib/auth/session.ts's establishSession). Falls back to the same
 * Accept-Language / trusted-country / English chain middleware.ts uses
 * so even a response rendered before the cookie exists is still
 * correctly localized, never a hardcoded "en".
 *
 * Relies on next/headers's request-scoped headers() for the
 * Accept-Language fallback — fine for Server Components (always rendered
 * inside a real request context) but NOT for Route Handlers, which
 * middleware.ts's own matcher explicitly excludes (`api/` is skipped),
 * so a handler can't assume the locale cookie is already set the way a
 * page render can. Route Handlers that need a locale (e.g. registration
 * seeding UserSettings.language) should use getLocaleFromRequest below
 * instead, which reads Accept-Language from the request object already
 * in hand rather than through that context-bound API.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  if (cookieValue && isLocale(cookieValue)) return cookieValue;

  const headerList = await headers();
  return resolveAutoLocale({
    acceptLanguage: headerList.get("accept-language"),
    country: getTrustedCountry(headerList),
  });
}

/**
 * Route Handler equivalent of getServerLocale() — same cookie-first
 * resolution, but reads Accept-Language/the trusted country header
 * directly off the request already passed into the handler instead of
 * next/headers's headers(). Currently used only by registration (see
 * app/api/auth/register/route.ts) to seed UserSettings.language with the
 * locale actually active for that request, rather than the bare schema
 * default.
 */
export async function getLocaleFromRequest(req: NextRequest): Promise<Locale> {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  if (cookieValue && isLocale(cookieValue)) return cookieValue;

  return resolveAutoLocale({
    acceptLanguage: req.headers.get("accept-language"),
    country: getTrustedCountry(req.headers),
  });
}

/** Convenience for Server Components that just need a `t(key)` function. */
export async function getServerTranslator(): Promise<(key: DictionaryKey) => string> {
  const locale = await getServerLocale();
  return (key: DictionaryKey) => translate(locale, key);
}
