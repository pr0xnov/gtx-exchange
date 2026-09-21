"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/locale-context";
import { LOCALES, localeName, type Locale } from "@/lib/i18n/config";
import { useTheme } from "@/lib/theme/theme-context";
import { THEMES, type Theme } from "@/lib/theme/config";

export function PreferencesSection() {
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="language-select">{t("settings.language")}</Label>
        <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
          <SelectTrigger id="language-select" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l} value={l}>
                {localeName(l)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="theme-select">{t("settings.theme")}</Label>
        <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          <SelectTrigger id="theme-select" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((th) => (
              <SelectItem key={th} value={th}>
                {th === "dark" ? t("settings.themeDark") : t("settings.themeLight")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
