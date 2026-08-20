"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Theme, THEME_COOKIE } from "./config";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Kept in sync with the `<html className>` app/layout.tsx already sets
 *  from the server-read cookie on first paint — this only ever *toggles*
 *  the same "dark" class client-side afterward, never adds a second
 *  competing mechanism. */
function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children?: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Server already rendered <html> with the right class for initialTheme
  // (see get-theme.ts + app/layout.tsx), so this only matters if this
  // provider is ever mounted with a client-only initial value that
  // disagrees with what the server sent — harmless no-op otherwise.
  useEffect(() => {
    applyThemeClass(initialTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;

    // Best-effort persistence to the authenticated user's UserSettings row
    // (Settings > Preferences is the only surface that calls setTheme, and
    // it's behind auth — see middleware.ts's PROTECTED_PREFIXES — so this
    // normally succeeds; a guest context would just get a harmless 401).
    fetch("/api/settings/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {
      // Cookie + in-memory state above already applied the change for
      // this session regardless of whether the DB write landed.
    });
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
