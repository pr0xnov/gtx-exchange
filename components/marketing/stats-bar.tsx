import { getServerTranslator } from "@/lib/i18n/get-locale";

export async function StatsBar() {
  const t = await getServerTranslator();

  const STATS = [
    { value: "24/7", label: t("marketing.stats.tradingLabel") },
    { value: "100+", label: t("marketing.stats.assetsLabel") },
    { value: "$250", label: t("marketing.stats.minDepositLabel") },
    { value: "1:100", label: t("marketing.stats.leverageLabel") },
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
          </div>
        ))}
      </div>
    </div>
  );
}
