import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "./config";

/**
 * Server Components: reads the theme cookie (set once a user actually
 * changes it — see theme-context.tsx). No browser-preference detection
 * for theme (unlike locale) — the product spec for this is simply
 * "default Dark until the user picks Light", so an absent cookie always
 * means Dark, never a prefers-color-scheme guess.
 */
export async function getServerTheme(): Promise<Theme> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return value && isTheme(value) ? value : DEFAULT_THEME;
}
