"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";
import { Skeleton } from "@/components/shared/skeleton";
import { quoteVolumeOf, tradingHref, type EnrichedMarket } from "@/lib/markets/derive";
import { formatCompactUsd } from "@/lib/utils";

export function HighestActivity({
  rows,
  isLoading,
  isAuthenticated,
}: {
  rows: EnrichedMarket[];
  isLoading: boolean;
  isAuthenticated: boolean;
}) {
  const { t } = useLocale();

  // Which 4 symbols even belong here depends on ranking by live volume —
  // unlike Popular Assets there's no fixed symbol list to show early, so
  // a plain skeleton grid (no symbols yet) is the honest loading state
  // rather than flashing empty until the first real ranking is known.
  const showSkeletonGrid = isLoading && rows.length === 0;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-foreground">
        {t("analytics.activity.title")}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {showSkeletonGrid &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-2 h-6 w-20" />
            </div>
          ))}

        {rows.map((row) => {
          const volume = quoteVolumeOf(row);
          return (
            <Link
              key={row.symbol}
              href={tradingHref(row.symbol, isAuthenticated)}
              className="rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
            >
              <div className="text-sm font-semibold text-foreground">{row.base}/USDT</div>
              {isLoading || volume === null ? (
                <Skeleton className="mt-2 h-6 w-20" />
              ) : (
                <div className="font-tabular mt-1 text-base font-bold text-foreground">
                  {formatCompactUsd(volume)}
                </div>
              )}
              <div className="mt-0.5 text-xs text-muted">
                {t("analytics.volume24hLabel")}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
