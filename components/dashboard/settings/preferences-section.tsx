"use client";

import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/locale-context";
import { LOCALES, localeName, type Locale } from "@/lib/i18n/config";
import { useTheme } from "@/lib/theme/theme-context";
import { THEMES, type Theme } from "@/lib/theme/config";

const SELECT_CLASSNAME =
  "mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground";

export function PreferencesSection() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="language-select">{t("settings.language")}</Label>
        <select
          id="language-select"
          className={SELECT_CLASSNAME}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {localeName(l)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="theme-select">{t("settings.theme")}</Label>
        <select
          id="theme-select"
          className={SELECT_CLASSNAME}
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          {THEMES.map((th) => (
            <option key={th} value={th}>
              {th === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
