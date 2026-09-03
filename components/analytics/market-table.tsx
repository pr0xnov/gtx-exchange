"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/shared/skeleton";
import {
  filterBySearch,
  quoteVolumeOf,
  tradingHref,
  type EnrichedMarket,
} from "@/lib/markets/derive";
import { cn, formatCompactUsd, formatPercent, formatPrice } from "@/lib/utils";

const INITIAL_ROWS = 10;
const PAGE_SIZE = 10;

type Filter = "all" | "gainers" | "losers";

export function MarketTable({
  rows,
  isLoading,
  isAuthenticated,
}: {
  rows: EnrichedMarket[];
  isLoading: boolean;
  isAuthenticated: boolean;
}) {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);

  const filtered = useMemo(() => {
    const byFilter = rows.filter((r) => {
      if (filter === "gainers") return r.change24h > 0;
      if (filter === "losers") return r.change24h < 0;
      return true;
    });
    return filterBySearch(byFilter, search);
  }, [rows, filter, search]);

  const visible = filtered.slice(0, visibleCount);

  function updateFilter(next: Filter) {
    setFilter(next);
    setVisibleCount(INITIAL_ROWS);
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-foreground">{t("analytics.table.title")}</h2>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(INITIAL_ROWS);
            }}
            placeholder={t("analytics.table.searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "gainers", "losers"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => updateFilter(f)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted hover:text-foreground"
              )}
            >
              {t(
                f === "all"
                  ? "analytics.table.filterAll"
                  : f === "gainers"
                    ? "analytics.table.filterGainers"
                    : "analytics.table.filterLosers"
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">
                {t("analytics.table.columnCoin")}
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                {t("analytics.table.columnPrice")}
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                {t("analytics.table.column24h")}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                {t("analytics.table.columnVolume")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td colSpan={4} className="px-4 py-3.5">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  {t("common.noData")}
                </td>
              </tr>
            )}

            {!isLoading &&
              visible.map((row) => {
                const up = row.change24h >= 0;
                const volume = quoteVolumeOf(row);
                return (
                  <tr
                    key={row.symbol}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={tradingHref(row.symbol, isAuthenticated)}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {row.base}/USDT
                      </Link>
                    </td>
                    <td className="font-tabular px-3 py-3 text-right text-foreground">
                      {formatPrice(row.price, row.price < 10 ? 4 : 2)}
                    </td>
                    <td
                      className={cn(
                        "font-tabular px-3 py-3 text-right font-medium",
                        up ? "text-primary" : "text-danger"
                      )}
                    >
                      {formatPercent(row.change24h)}
                    </td>
                    <td className="font-tabular px-4 py-3 text-right text-muted">
                      {volume !== null ? formatCompactUsd(volume) : "—"}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {visibleCount < filtered.length && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          >
            {t("analytics.table.showMore")}
          </Button>
        </div>
      )}
    </section>
  );
}
