// Order matches the task GTX was extended under — also the order the
// language dropdown renders in (see components/layout/navbar.tsx's
// LOCALES.map), so this list doubles as "menu order", not just "valid
// set". Adding a 9th locale later means: add it here, add its
// label/name below, add its lib/i18n/locales/<code>.ts file — nothing
// else in the app hardcodes the locale count (the dropdown, the mobile
// selector, the Settings page selector, and the settings API's
// z.enum(LOCALES) validation all already derive from this array).
export const LOCALES = ["uk", "ru", "en", "es", "pt", "tr", "de", "pl"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "gtx_locale";

const LOCALE_LABELS: Record<Locale, string> = {
  uk: "UA",
  ru: "RU",
  en: "EN",
  es: "ES",
  pt: "PT",
  tr: "TR",
  de: "DE",
  pl: "PL",
};
const LOCALE_NAMES: Record<Locale, string> = {
  uk: "Українська",
  ru: "Русский",
  en: "English",
  es: "Español",
  pt: "Português",
  tr: "Türkçe",
  de: "Deutsch",
  pl: "Polski",
};

export function localeLabel(locale: Locale): string {
  return LOCALE_LABELS[locale];
}

export function localeName(locale: Locale): string {
  return LOCALE_NAMES[locale];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** UserSettings.language is a plain `String` column (Prisma has no enum
 *  binding to Locale), so anywhere that value flows into a Locale-typed
 *  API (e.g. an email template) needs this same narrow-or-fall-back —
 *  centralized here instead of repeated at each call site. */
export function resolveUserLocale(language: string | null | undefined): Locale {
  return language && isLocale(language) ? language : DEFAULT_LOCALE;
}

/**
 * Picks a supported locale out of a raw Accept-Language header value
 * (e.g. "uk-UA,uk;q=0.9,en;q=0.8,*;q=0.5") by primary subtag — the same
 * signal `navigator.language` exposes client-side, but reading it here
 * (from the request the server already has) means the very first
 * response is correctly localized with no client-only detection step.
 * Returns null on no match (never a hardcoded default) so callers can
 * chain further fallbacks (see resolveAutoLocale below) before finally
 * settling on DEFAULT_LOCALE themselves.
 */
export function resolveLocaleFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;

  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => Boolean(tag));

  for (const tag of tags) {
    const primary = tag.split("-")[0];
    if (primary && isLocale(primary)) return primary;
  }

  return null;
}

/**
 * Country -> locale fallback, used only when Accept-Language itself
 * didn't resolve to a supported locale (see resolveAutoLocale). The
 * country code itself must come from a genuinely trusted source — see
 * lib/security/geo.ts's own doc comment on why this app (plain
 * self-hosted Docker Compose, no Vercel/Cloudflare/CloudFront in front
 * today) can't yet trust any platform-supplied country header, and gates
 * reading one behind the same TRUST_PROXY_HEADERS flag the IP-based
 * anti-abuse check already uses.
 */
const COUNTRY_LOCALE_MAP: Record<string, Locale> = {
  UA: "uk",
  RU: "ru",
  ES: "es",
  PT: "pt",
  BR: "pt", // Brazil — Portuguese, per spec
  TR: "tr",
  DE: "de",
  AT: "de", // Austria — German, per spec
  PL: "pl",
};

export function resolveLocaleFromCountry(
  countryCode: string | null | undefined
): Locale | null {
  if (!countryCode) return null;
  return COUNTRY_LOCALE_MAP[countryCode.trim().toUpperCase()] ?? null;
}

/**
 * The full first-visit auto-detection chain (see middleware.ts and
 * get-locale.ts, the only two callers — both only reach this when no
 * locale cookie exists yet, i.e. before any manual choice could exist):
 * Accept-Language match, then trusted country fallback, then English.
 * Never called once a cookie (manual or previously auto-detected)
 * already exists — that's the actual "manual choice always wins"
 * guarantee, enforced by the callers checking for the cookie first, not
 * by anything in this function.
 */
export function resolveAutoLocale(params: {
  acceptLanguage: string | null;
  country: string | null;
}): Locale {
  return (
    resolveLocaleFromAcceptLanguage(params.acceptLanguage) ??
    resolveLocaleFromCountry(params.country) ??
    DEFAULT_LOCALE
  );
}
