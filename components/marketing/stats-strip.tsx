import { getServerTranslator } from "@/lib/i18n/get-locale";

export async function StatsStrip() {
  const t = await getServerTranslator();

  const STATS = [
    {
      value: t("marketing.home.stats.bonus.value"),
      label: t("marketing.home.stats.bonus.label"),
    },
    {
      value: t("marketing.home.stats.assets.value"),
      label: t("marketing.home.stats.assets.label"),
    },
    {
      value: t("marketing.home.stats.uptime.value"),
      label: t("marketing.home.stats.uptime.label"),
    },
    {
      value: t("marketing.home.stats.referral.value"),
      label: t("marketing.home.stats.referral.label"),
      sublabel: t("marketing.home.stats.referral.sublabel"),
    },
  ];

  return (
    <div className="border-t border-border/60">
      <div className="container grid grid-cols-2 divide-x divide-border/60 py-8 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="px-4 text-center first:pl-0 sm:text-left sm:first:pl-4"
          >
            <div className="text-2xl font-extrabold text-foreground sm:text-3xl">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted sm:text-sm">{s.label}</div>
            {s.sublabel && (
              <div className="mt-0.5 text-[11px] text-muted/70">{s.sublabel}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
