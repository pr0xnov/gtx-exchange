"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MiniMarketTable } from "@/components/markets/mini-market-table";
import {
  filterBySearch,
  sortRows,
  type EnrichedMarket,
  type SortDirection,
  type SortKey,
} from "@/lib/markets/derive";

const PAGE_SIZE = 20;

/**
 * Search + sort + pagination state for "Все криптовалюты" and
 * "Избранные" (the two blocks that show the full/filtered asset list
 * rather than a curated top-N slice) — the actual table markup is
 * MiniMarketTable, shared with every other block on the page.
 */
export function AllMarketsTable({
  title,
  rows,
  isLoading,
  search,
  favorites,
  onToggleFavorite,
  sparklines,
  isAuthenticated,
  emptyMessage,
}: {
  title: string;
  rows: EnrichedMarket[];
  isLoading: boolean;
  search: string;
  favorites: ReadonlySet<string>;
  onToggleFavorite: (symbol: string) => void;
  sparklines: Record<string, number[]>;
  isAuthenticated: boolean;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => filterBySearch(rows, search), [rows, search]);
  const sorted = useMemo(
    () => sortRows(filtered, sortKey, sortDirection),
    [filtered, sortKey, sortDirection]
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const resolvedEmptyMessage =
    rows.length === 0 && emptyMessage ? emptyMessage : "No cryptocurrencies found.";

  return (
    <MiniMarketTable
      title={title}
      rows={pageRows}
      isLoading={isLoading}
      favorites={favorites}
      onToggleFavorite={onToggleFavorite}
      sparklines={sparklines}
      isAuthenticated={isAuthenticated}
      emptyMessage={resolvedEmptyMessage}
      startIndex={(currentPage - 1) * PAGE_SIZE}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={toggleSort}
      footer={
        !isLoading && sorted.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
            <span>
              Page {currentPage} of {pageCount} · {sorted.length} assets
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/5 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/5 hover:text-foreground disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : undefined
      }
    />
  );
}
