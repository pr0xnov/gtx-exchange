import { DEFAULT_LOCALE, Locale } from "./config";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { uk } from "./locales/uk";
import { es } from "./locales/es";
import { pt } from "./locales/pt";
import { tr } from "./locales/tr";
import { de } from "./locales/de";
import { pl } from "./locales/pl";
import type { Dictionary, DictionaryKey } from "./dictionary-type";

export type { DictionaryKey, Dictionary } from "./dictionary-type";

export const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru,
  uk,
  es,
  pt,
  tr,
  de,
  pl,
};

export function translate(locale: Locale, key: DictionaryKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE][key];
}
