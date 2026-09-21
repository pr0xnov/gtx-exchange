/**
 * Guards the 8 locale dictionaries (lib/i18n/locales/*.ts) against the
 * exact class of bug this test was added for: a key present everywhere
 * but with a value that's empty, or accidentally left as another
 * locale's text (e.g. Russian pasted into the Ukrainian slot) instead of
 * actually being translated. TypeScript's `Dictionary = Record
 * <DictionaryKey, string>` (lib/i18n/dictionary-type.ts) already forces
 * every locale to have the *same set* of keys — a truly missing key is a
 * compile error, not a runtime bug — so this test focuses on what type
 * checking can't catch: suspicious *values*.
 */
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

const RU_ONLY_LETTERS = /[ыэъЫЭЪ]/;
const CYRILLIC = /[Ѐ-ӿ]/;
const NON_CYRILLIC_LOCALES = LOCALES.filter((l) => l !== "ru" && l !== "uk");

// Legitimately empty in some locales by design, not a missed translation —
// "Trade on GTX" needs no linking word before the brand name in en/es/pt/
// tr/de/pl, but ru/uk's grammar requires one ("Торгуйте НА GTX"), so only
// those two carry a non-empty value here. Keep this list short and
// explained; it's an allowlist for a real grammatical exception, not a
// way to silence future blank-value bugs.
const ALLOWED_BLANK_KEYS = new Set(["marketing.home.hero.titlePrefix"]);

describe("i18n dictionary parity across all 8 locales", () => {
  it("every locale has exactly the same set of translation keys", () => {
    const [first, ...rest] = LOCALES;
    const referenceKeys = Object.keys(dictionaries[first]).sort();
    for (const locale of rest) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(referenceKeys);
    }
  });

  it("no locale has an empty-string value for any key", () => {
    for (const locale of LOCALES) {
      const blank = Object.entries(dictionaries[locale])
        .filter(
          ([key, value]) =>
            typeof value === "string" &&
            value.trim() === "" &&
            !ALLOWED_BLANK_KEYS.has(key)
        )
        .map(([key]) => key);
      expect(blank, `${locale} has blank values for: ${blank.join(", ")}`).toEqual([]);
    }
  });

  it("uk (Ukrainian) values never contain Russian-only letters (ы/э/ъ)", () => {
    const offenders = Object.entries(dictionaries.uk)
      .filter(([, value]) => typeof value === "string" && RU_ONLY_LETTERS.test(value))
      .map(([key, value]) => `${key}="${value}"`);
    expect(
      offenders,
      `Likely leftover Russian text in uk.ts: ${offenders.join(", ")}`
    ).toEqual([]);
  });

  it("non-Cyrillic locales (en/es/pt/tr/de/pl) never contain Cyrillic characters", () => {
    for (const locale of NON_CYRILLIC_LOCALES) {
      const offenders = Object.entries(dictionaries[locale])
        .filter(([, value]) => typeof value === "string" && CYRILLIC.test(value))
        .map(([key, value]) => `${key}="${value}"`);
      expect(
        offenders,
        `${locale}.ts unexpectedly contains Cyrillic text: ${offenders.join(", ")}`
      ).toEqual([]);
    }
  });
});
