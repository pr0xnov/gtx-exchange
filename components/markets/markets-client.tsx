"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMarkets, useSparklines } from "@/hooks/use-api";
import { useLivePrices } from "@/hooks/use-live-prices";
import { useFavorites } from "@/hooks/use-favorites";
import { POPULAR_SYMBOLS, TRACKED_SYMBOLS } from "@/lib/binance/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";
import { AllMarketsTable } from "@/components/markets/all-markets-table";
import { MiniMarketTable } from "@/components/markets/mini-market-table";
import {
  getBiggestMovers,
  getPopular,
  getTopGainers,
  getTopLosers,
  getTopVolume,
  mergeMarketData,
} from "@/lib/markets/derive";

const SEARCH_DEBOUNCE_MS = 300;

// `label` is a dictionary key (see lib/i18n/dictionaries.ts, "markets.tabs.*"),
// resolved to display text at render time via t() — kept as a plain data
// key (not the translated string itself) so this array stays a pure,
// locale-independent constant that getVisibleTabs/tests can use without a
// hook, while the rendered tab nav below translates each label.
export const TABS = [
  { id: "all", label: "markets.tabs.all" },
  { id: "favorites", label: "markets.tabs.favorites" },
  { id: "popular", label: "markets.tabs.popular" },
  { id: "gainers", label: "markets.tabs.gainers" },
  { id: "losers", label: "markets.tabs.losers" },
  { id: "volume", label: "markets.tabs.volume" },
  { id: "movers", label: "markets.tabs.movers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SEARCHABLE_TABS: TabId[] = ["all"];

/** Избранные is an authenticated-account feature — hidden from the tab
 *  list entirely for a guest, not just inert. Exported as its own pure
 *  function (rather than an inline expression) so this exact mechanism
 *  is directly unit-testable without mounting the whole page. */
export function getVisibleTabs(isAuthenticated: boolean) {
  return isAuthenticated ? TABS : TABS.filter((t) => t.id !== "favorites");
}

/**
 * Single source of market data for the whole /markets page: one
 * useMarkets() REST snapshot (already polls every 3s), one
 * useLivePrices() WS subscription (the same hook Trading uses), and one
 * useSparklines() batch of one-shot klines requests — merged/computed
 * once here, then every block below just slices/sorts/filters that same
 * data. No block fetches, polls, or renders its own table markup.
 *
 * Favorites are an authenticated-account feature: for a guest, the
 * Избранные tab and every star are hidden entirely (not just inert) —
 * see the filtered `visibleTabs` below and MiniMarketTable's
 * isAuthenticated-gated star column — and useFavorites(isAuthenticated)
 * never touches localStorage at all while isAuthenticated is false.
 */
export function MarketsClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useLocale();
  const { data, isLoading } = useMarkets();
  const { prices } = useLivePrices();
  const sparklines = useSparklines(TRACKED_SYMBOLS);
  const { favorites, toggleFavorite } = useFavorites(isAuthenticated);

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const visibleTabs = getVisibleTabs(isAuthenticated);

  const rows = useMemo(() => mergeMarketData(data ?? [], prices), [data, prices]);
  const favoriteRows = useMemo(
    () => rows.filter((r) => favorites.has(r.symbol)),
    [rows, favorites]
  );

  const popular = useMemo(() => getPopular(rows, POPULAR_SYMBOLS), [rows]);
  const gainers = useMemo(() => getTopGainers(rows), [rows]);
  const losers = useMemo(() => getTopLosers(rows), [rows]);
  const topVolume = useMemo(() => getTopVolume(rows), [rows]);
  const biggestMovers = useMemo(() => getBiggestMovers(rows), [rows]);

  const showSearch = SEARCHABLE_TABS.includes(activeTab);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("markets.title")}</h1>

        <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-border">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              {t(tab.label)}
            </button>
          ))}
        </nav>

        {showSearch && (
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder={t("nav.searchPlaceholder")}
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === "all" && (
        <AllMarketsTable
          title={t("markets.tabs.all")}
          rows={rows}
          isLoading={isLoading}
          search={debouncedSearch}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
        />
      )}

      {activeTab === "favorites" && (
        <AllMarketsTable
          title={t("markets.tabs.favorites")}
          rows={favoriteRows}
          isLoading={isLoading}
          search={debouncedSearch}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
          emptyMessage={t("markets.emptyFavorites")}
        />
      )}

      {activeTab === "popular" && (
        <MiniMarketTable
          title={t("markets.tabs.popular")}
          rows={popular}
          isLoading={isLoading}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
        />
      )}

      {activeTab === "gainers" && (
        <MiniMarketTable
          title={t("markets.tabs.gainers")}
          rows={gainers}
          isLoading={isLoading}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
        />
      )}

      {activeTab === "losers" && (
        <MiniMarketTable
          title={t("markets.tabs.losers")}
          rows={losers}
          isLoading={isLoading}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
        />
      )}

      {activeTab === "volume" && (
        <MiniMarketTable
          title={t("markets.tabs.volume")}
          rows={topVolume}
          isLoading={isLoading}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
        />
      )}

      {activeTab === "movers" && (
        <MiniMarketTable
          title={t("markets.tabs.movers")}
          rows={biggestMovers}
          isLoading={isLoading}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}
