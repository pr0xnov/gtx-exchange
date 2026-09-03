"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { MarketCarousel } from "./market-carousel";
import type { EnrichedMarket } from "@/lib/markets/derive";

/**
 * "Обзор рынка" — one section, two carousels (gainers/losers) sharing the
 * same already-merged market dataset (see analytics-dashboard.tsx). No
 * separate fetch, no separate section wrapper per carousel.
 */
export function MarketOverviewSection({
  gainers,
  losers,
  isLoading,
  isAuthenticated,
}: {
  gainers: EnrichedMarket[];
  losers: EnrichedMarket[];
  isLoading: boolean;
  isAuthenticated: boolean;
}) {
  const { t } = useLocale();

  return (
    <section>
      <h2 className="text-xl font-bold text-foreground">
        {t("analytics.marketOverview.title")}
      </h2>
      <MarketCarousel
        title={t("analytics.marketOverview.gainersCarousel")}
        rows={gainers}
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
      />
      <MarketCarousel
        title={t("analytics.marketOverview.losersCarousel")}
        rows={losers}
        isLoading={isLoading}
        isAuthenticated={isAuthenticated}
      />
    </section>
  );
}
