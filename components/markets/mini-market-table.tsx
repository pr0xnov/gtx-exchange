"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Star } from "lucide-react";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/shared/skeleton";
import { CoinIcon } from "@/components/markets/coin-icon";
import { MiniSparkline } from "@/components/markets/mini-sparkline";
import type { EnrichedMarket, SortDirection, SortKey } from "@/lib/markets/derive";

const SORT_LABEL: Record<SortKey, string> = {
  name: "Монета",
  price: "Цена",
  change24h: "Изменение 24ч",
  volume24h: "Объём 24ч",
};

const SORTABLE_KEYS = Object.keys(SORT_LABEL) as SortKey[];
// The 3 numeric sortable columns, i.e. everything sortable except "name"
// (Монета) — its own header is rendered separately so it can suppress
// the sort-direction arrow (see showIndicator below) without affecting
// the other three, and so it can sit right after № with nothing between
// them and Цена/Изменение/Объём/График.
const NUMERIC_SORTABLE_KEYS = SORTABLE_KEYS.filter((k) => k !== "name");

function SortableHeader({
  sortKeyName,
  active,
  direction,
  onClick,
  showIndicator = true,
}: {
  sortKeyName: SortKey;
  active: boolean;
  direction?: SortDirection;
  onClick?: (key: SortKey) => void;
  /** "Монета" defaults to the active sort column (see AllMarketsTable's
   *  initial sortKey), so its arrow was always visible even though the
   *  column's own label already makes it obvious what's sorted — the
   *  header is still fully clickable/sortable, it just never renders the
   *  ArrowUp/ArrowDown indicator. */
  showIndicator?: boolean;
}) {
  const label = SORT_LABEL[sortKeyName];
  if (!onClick) return <span>{label}</span>;
  return (
    <button
      onClick={() => onClick(sortKeyName)}
      className="flex w-full items-center justify-center gap-1 hover:text-foreground"
    >
      {label}
      {showIndicator &&
        active &&
        (direction === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        ))}
    </button>
  );
}

/**
 * The single row/table renderer for every block on /markets — Все
 * криптовалюты, Избранные, Популярные, Показывают рост, Теряют в цене,
 * Максимальный объём, Наибольшее движение all render through this one
 * component (AllMarketsTable delegates to it too), so column layout,
 * typography, hover and row-click behave identically everywhere instead
 * of five near-duplicate tables drifting apart.
 *
 * Sort headers only render as clickable when `onSort` is passed (the
 * search/sort/paginate blocks via AllMarketsTable); the curated top-N
 * blocks pass no sort props and get plain static headers, since their
 * order is fixed by the caller.
 *
 * Favorites are an authenticated-account feature: when `isAuthenticated`
 * is false, the star button doesn't render at all — there is no
 * favoriting UI for a guest to discover or use. It lives inside the
 * Монета cell (not a separate column) so the table keeps a fixed 6-column
 * grid (№/Монета/Цена/Изменение/Объём/График) regardless of auth state.
 * Row hover/click and everything else is unaffected.
 */
export function MiniMarketTable({
  title,
  rows,
  isLoading,
  favorites,
  onToggleFavorite,
  sparklines,
  isAuthenticated,
  emptyMessage = "No data available.",
  sortKey,
  sortDirection,
  onSort,
  footer,
  startIndex = 0,
}: {
  title: string;
  rows: EnrichedMarket[];
  isLoading: boolean;
  favorites: ReadonlySet<string>;
  onToggleFavorite: (symbol: string) => void;
  sparklines: Record<string, number[]>;
  isAuthenticated: boolean;
  emptyMessage?: string;
  sortKey?: SortKey;
  sortDirection?: SortDirection;
  onSort?: (key: SortKey) => void;
  footer?: ReactNode;
  /** Row number to continue from, for a paginated caller (AllMarketsTable)
   *  — e.g. 20 on page 2 with pageSize 20, so rows read 21, 22, 23…
   *  instead of restarting at 1 every page. Every other block (no
   *  pagination) omits this and keeps numbering from 1, unchanged. */
  startIndex?: number;
}) {
  const router = useRouter();
  // №, Монета (icon+name, with the favorite star folded into this same
  // cell — see the colgroup note below for why it isn't a separate
  // column), Цена, Изменение 24ч, Объём 24ч, График: always 6 columns,
  // authenticated or not.
  const columnCount = 6;

  function goToTrading(symbol: string) {
    const destination = `/trading?symbol=${symbol}`;
    if (isAuthenticated) {
      router.push(destination);
    } else {
      // /trading is auth-protected (middleware.ts) — pushing straight
      // there would just bounce through a server redirect that drops the
      // query string. Going to /login directly preserves the intended
      // destination (via the same `redirect` param middleware already
      // uses elsewhere) for whenever the login flow picks it up.
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          {/* table-fixed + this colgroup is what keeps every tab's columns
              at identical widths — with the default table-layout: auto,
              each render of this table sized its own columns from that
              tab's own row content (huge numbers in "Максимальный объём"
              vs. small ones elsewhere), so the same column visually
              landed in a different place tab to tab. Column count/order
              here must stay in lockstep with the actual <th>/<td> list
              below.

              Only 6 columns — the favorite star (when isAuthenticated)
              is rendered *inside* the Монета cell rather than as its own
              <col>, so there's no 7th column to make room for.

              These 6 values are the literal target percentages, summing
              to exactly 100 — reset here to the clean 5/25/14/12/15/29
              spec after several prior tasks each grew График relative to
              whatever it last rendered at, compounding into a lopsided
              layout (Монета down to ~9%, cells pinned to the right edge
              with dead space alongside). table-layout: fixed reads these
              directly as-is when they already sum to 100, so what's
              declared here is exactly what renders — no implicit
              rescaling to account for. Header <th> and body <td> share
              this one <colgroup> (same <table>), which is what makes it
              structurally impossible for header and rows to disagree on
              column widths — there's only one grid, not a separate one
              per row. */}
          <colgroup>
            <col className="w-[5%]" />
            <col className="w-[25%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[29%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">№</th>
              <th className="px-3 py-2.5 text-center font-medium">
                <SortableHeader
                  sortKeyName="name"
                  active={sortKey === "name"}
                  direction={sortDirection}
                  onClick={onSort}
                  showIndicator={false}
                />
              </th>
              {NUMERIC_SORTABLE_KEYS.map((key) => (
                <th key={key} className="px-3 py-2.5 text-center font-medium">
                  <SortableHeader
                    sortKeyName={key}
                    active={sortKey === key}
                    direction={sortDirection}
                    onClick={onSort}
                  />
                </th>
              ))}
              <th className="px-2 py-2.5 text-center font-medium">График</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td colSpan={columnCount} className="px-4 py-3.5">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-8 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row, i) => {
                const up = row.change24h >= 0;
                const isFavorite = favorites.has(row.symbol);
                return (
                  <tr
                    key={row.id}
                    onClick={() => goToTrading(row.symbol)}
                    className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="font-tabular px-4 py-3.5 text-muted">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex min-w-0 items-center gap-2">
                        {isAuthenticated && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(row.symbol);
                            }}
                            className="flex shrink-0 items-center justify-center rounded-lg p-1 text-muted hover:text-foreground"
                            aria-label={
                              isFavorite ? "Remove from favorites" : "Add to favorites"
                            }
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                isFavorite && "fill-primary text-primary"
                              )}
                            />
                          </button>
                        )}
                        <CoinIcon symbol={row.base} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground">
                            {row.name}
                          </div>
                          <div className="truncate text-xs text-muted">
                            {row.displaySymbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-tabular truncate px-3 py-3.5 text-center text-foreground">
                      {formatPrice(row.price, row.price < 10 ? 4 : 2)}
                    </td>
                    <td
                      className={cn(
                        "font-tabular truncate px-3 py-3.5 text-center",
                        up ? "text-primary" : "text-danger"
                      )}
                    >
                      {formatPercent(row.change24h)}
                    </td>
                    <td className="font-tabular truncate px-3 py-3.5 text-center text-foreground">
                      {row.volume24h != null ? formatPrice(row.volume24h, 2) : "--"}
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="mx-auto w-32">
                        <MiniSparkline prices={sparklines[row.symbol]} positive={up} />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}
