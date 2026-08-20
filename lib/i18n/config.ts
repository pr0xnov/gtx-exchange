export const LOCALES = ["en", "ru", "uk"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "gtx_locale";

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", ru: "RU", uk: "UA" };
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  uk: "Українська",
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
 * Picks the best supported locale out of a raw Accept-Language header
 * value (e.g. "uk-UA,uk;q=0.9,en;q=0.8,*;q=0.5") — the same signal
 * `navigator.language` exposes client-side, but reading it here (from the
 * request the server already has) means the very first response is
 * correctly localized with no client-only detection step, so there's
 * nothing to flash/hydrate-mismatch on. Good enough for our 3 supported
 * locales without pulling in a full content-negotiation library.
 */
export function resolveLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => Boolean(tag));

  for (const tag of tags) {
    const primary = tag.split("-")[0];
    if (primary && isLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}
