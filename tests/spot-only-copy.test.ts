/**
 * GTX is Spot-only (see components/trading/trading-terminal.tsx's own
 * doc comment: the Futures UI was removed from the terminal, its backend
 * deliberately left dormant on disk). This is a durable regression guard
 * against any user-facing copy (any locale) reintroducing a "Futures" /
 * "Fутьюрс" mention — not just the one FAQ answer that was actually wrong
 * (see the FAQ FIX this was built under).
 */
import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";

const FUTURES_PATTERN = /future|futures|фьючер|ф['’]ючер/i;

describe("No user-facing 'Futures' copy in any locale dictionary", () => {
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    it(`${locale}: no dictionary value mentions Futures`, () => {
      const offenders = Object.entries(dictionary).filter(([, value]) =>
        FUTURES_PATTERN.test(value)
      );
      expect(offenders).toEqual([]);
    });
  }
});
