import { cookies, headers } from "next/headers";
import {
  LOCALE_COOKIE,
  Locale,
  isLocale,
  resolveLocaleFromAcceptLanguage,
} from "./config";
import { DictionaryKey, translate } from "./dictionaries";

/**
 * Server Components: reads the locale cookie (set by middleware.ts on
 * first visit, or by the manual switcher — see locale-context.tsx). Falls
 * back to parsing Accept-Language directly so even a response rendered
 * before the cookie exists is still correctly localized, never a hardcoded
 * "en".
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  if (cookieValue && isLocale(cookieValue)) return cookieValue;

  const headerList = await headers();
  return resolveLocaleFromAcceptLanguage(headerList.get("accept-language"));
}

/** Convenience for Server Components that just need a `t(key)` function. */
export async function getServerTranslator(): Promise<(key: DictionaryKey) => string> {
  const locale = await getServerLocale();
  return (key: DictionaryKey) => translate(locale, key);
}
