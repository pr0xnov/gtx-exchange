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

function SortableHeader({
  sortKeyName,
  active,
  direction,
  onClick,
}: {
  sortKeyName: SortKey;
  active: boolean;
  direction?: SortDirection;
  onClick?: (key: SortKey) => void;
}) {
  const label = SORT_LABEL[sortKeyName];
  if (!onClick) return <span>{label}</span>;
  return (
    <button
      onClick={() => onClick(sortKeyName)}
      className="flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {active &&
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
 * is false, the star column doesn't render at all (no button, no
 * placeholder header) — there is no favoriting UI for a guest to
 * discover or use. Row hover/click and everything else is unaffected.
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
  // №, [star], coin, price, change, volume, sparkline — star column only
  // exists for an authenticated user.
  const columnCount = isAuthenticated ? 7 : 6;

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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="w-8 px-4 py-2.5 font-medium">№</th>
              {isAuthenticated && <th className="w-8 px-2 py-2.5 font-medium" />}
              {SORTABLE_KEYS.map((key) => (
                <th key={key} className="px-2 py-2.5 font-medium">
                  <SortableHeader
                    sortKeyName={key}
                    active={sortKey === key}
                    direction={sortDirection}
                    onClick={onSort}
                  />
                </th>
              ))}
              <th className="px-2 py-2.5 font-medium">График</th>
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
                    {isAuthenticated && (
                      <td className="px-2 py-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(row.symbol);
                          }}
                          className="flex items-center justify-center rounded-lg p-1 text-muted hover:text-foreground"
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
                      </td>
                    )}
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-2">
                        <CoinIcon symbol={row.base} />
                        <div>
                          <div className="font-medium text-foreground">{row.name}</div>
                          <div className="text-xs text-muted">{row.displaySymbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-tabular px-2 py-3.5 text-foreground">
                      {formatPrice(row.price, row.price < 10 ? 4 : 2)}
                    </td>
                    <td
                      className={cn(
                        "font-tabular px-2 py-3.5",
                        up ? "text-primary" : "text-danger"
                      )}
                    >
                      {formatPercent(row.change24h)}
                    </td>
                    <td className="font-tabular px-2 py-3.5 text-foreground">
                      {row.volume24h != null ? formatPrice(row.volume24h, 2) : "--"}
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="w-20">
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
