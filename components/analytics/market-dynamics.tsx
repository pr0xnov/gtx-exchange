"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { Skeleton } from "@/components/shared/skeleton";
import { MarketSelector } from "./market-selector";
import { MarketDynamicsChart } from "./market-dynamics-chart";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import type { EnrichedMarket } from "@/lib/markets/derive";

const DEFAULT_SYMBOL = "BTCUSDT";

/**
 * "Динамика рынка" — a searchable market selector (any GTX-supported
 * pair, not a fixed BTC/ETH/SOL switch) plus a real 24h price line for
 * whichever pair is selected. Current price/24h% reuse the same shared
 * `rows` dataset every other /analytics section already gets from
 * analytics-dashboard.tsx; only the chart's own historical series is
 * fetched separately (one pair at a time — see MarketDynamicsChart).
 */
export function MarketDynamics({
  rows,
  isLoading,
}: {
  rows: EnrichedMarket[];
  isLoading: boolean;
}) {
  const { t } = useLocale();
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const row = rows.find((r) => r.symbol === symbol);
  const showPriceSkeleton = isLoading || !row;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-foreground">
        {t("analytics.dynamics.title")}
      </h2>
      <div className="mt-3 rounded-2xl border border-border bg-card p-5">
        <MarketSelector value={symbol} onChange={setSymbol} />

        <div className="mt-3">
          {showPriceSkeleton ? (
            <Skeleton className="h-7 w-32" />
          ) : (
            <div className="font-tabular text-2xl font-bold text-foreground">
              {formatPrice(row.price, row.price < 10 ? 4 : 2)}
            </div>
          )}
          {!showPriceSkeleton && (
            <div
              className={cn(
                "font-tabular mt-0.5 text-sm font-semibold",
                row.change24h >= 0 ? "text-primary" : "text-danger"
              )}
            >
              {formatPercent(row.change24h)}{" "}
              <span className="font-normal text-muted">
                {t("analytics.dynamics.period24h")}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <MarketDynamicsChart symbol={symbol} />
        </div>
      </div>
    </section>
  );
}
