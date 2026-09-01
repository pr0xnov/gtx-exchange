import type { Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";
import { formatDate } from "@/lib/utils";

/** "5 хв тому" / "5 мин назад" style relative time — plain translated
 *  words + a number, not full i18n-library pluralization, matching this
 *  project's own translate(locale, key) (no interpolation support, and
 *  none is added here just for this). Falls back to the project's
 *  existing formatDate() past 48h, same as every other timestamp in the
 *  app. */
export function formatRelativeTime(iso: string, locale: Locale): string {
  const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);

  if (minutes < 1) return translate(locale, "news.time.justNow");
  if (minutes < 60) return `${minutes} ${translate(locale, "news.time.minutesAgo")}`;
  if (hours < 24) return `${hours} ${translate(locale, "news.time.hoursAgo")}`;
  if (hours < 48) return translate(locale, "news.time.yesterday");
  return formatDate(iso);
}
