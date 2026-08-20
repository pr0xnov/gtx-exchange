export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "dark";
export const THEME_COOKIE = "gtx_theme";

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}
