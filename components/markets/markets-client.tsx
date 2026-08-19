"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useMarkets, useSparklines } from "@/hooks/use-api";
import { useLivePrices } from "@/hooks/use-live-prices";
import { useFavorites } from "@/hooks/use-favorites";
import { POPULAR_SYMBOLS, TRACKED_SYMBOLS } from "@/lib/binance/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
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

export const TABS = [
  { id: "all", label: "Все криптовалюты" },
  { id: "favorites", label: "Избранные" },
  { id: "popular", label: "Популярные" },
  { id: "gainers", label: "Показывают рост" },
  { id: "losers", label: "Теряют в цене" },
  { id: "volume", label: "Максимальный объём" },
  { id: "movers", label: "Наибольшее движение" },
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
        <h1 className="text-2xl font-bold text-foreground">Markets</h1>

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
              {tab.label}
            </button>
          ))}
        </nav>

        {showSearch && (
          <div className="relative mt-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search cryptocurrencies"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        )}
      </div>

      {activeTab === "all" && (
        <AllMarketsTable
          title="Все криптовалюты"
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
          title="Избранные"
          rows={favoriteRows}
          isLoading={isLoading}
          search={debouncedSearch}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          sparklines={sparklines}
          isAuthenticated={isAuthenticated}
          emptyMessage="У вас пока нет избранных криптовалют"
        />
      )}

      {activeTab === "popular" && (
        <MiniMarketTable
          title="Популярные"
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
          title="Показывают рост"
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
          title="Теряют в цене"
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
          title="Максимальный объём"
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
          title="Наибольшее движение"
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
