"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Locale, LOCALE_COOKIE } from "./config";
import { DictionaryKey, translate } from "./dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: DictionaryKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * `initialLocale` comes from the server (see get-locale.ts, threaded
 * through app/layout.tsx -> app/providers.tsx) so first paint is already
 * correct — this never re-detects locale on the client, which is what
 * would risk a hydration mismatch or a visible EN-then-RU flash.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  // Optional only so React.createElement(LocaleProvider, { initialLocale },
  // child) — the 3-arg form tests in this repo use, since they're .ts (no
  // JSX) — type-checks: @types/react's createElement overloads don't merge
  // variadic children into a props type where children sits alongside
  // another required prop. Every real call site still always passes it.
  children?: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      // One year, same as a manual choice being expected to "stick" across
      // closing the browser per this task's spec — the single source of
      // truth for the selected locale, read by both the client (this
      // context) and the server (get-locale.ts) from the same cookie name.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
      // Re-renders Server Components (e.g. the <html lang> in the root
      // layout, or any server-rendered page copy) with the new cookie —
      // client components already re-render from the state update above.
      // The current route/URL is untouched, so this never navigates.
      router.refresh();
    },
    [router]
  );

  const t = useCallback((key: DictionaryKey) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
