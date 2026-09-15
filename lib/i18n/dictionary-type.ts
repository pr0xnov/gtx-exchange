import type { en } from "./locales/en";

/** Derived from the English dictionary's own key set — every other
 *  locale file (lib/i18n/locales/*.ts) is typed as `Dictionary`, so
 *  TypeScript refuses to compile if any of them is missing a key `en`
 *  has, or has one `en` doesn't. Kept in its own file (rather than
 *  living in dictionaries.ts, which imports every locale) so each
 *  locale file can import just this type without a circular import back
 *  through dictionaries.ts. */
export type DictionaryKey = keyof typeof en;
export type Dictionary = Record<DictionaryKey, string>;
