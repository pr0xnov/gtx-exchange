"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Search } from "lucide-react";
import { useMarkets } from "@/hooks/use-api";
import { useLivePrices } from "@/hooks/use-live-prices";
import { filterBySearch, mergeMarketData } from "@/lib/markets/derive";
import { CoinIcon } from "@/components/markets/coin-icon";
import { cn, formatPercent, formatPrice } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

const RESULT_LIMIT = 20;

/**
 * Compact search button in the Navbar — opens a dropdown listing
 * cryptocurrencies (icon, symbol, name, price, 24h change) that routes to
 * Trading on click. Uses the exact same data path as Markets
 * (useMarkets + useLivePrices merged via mergeMarketData, filtered with
 * filterBySearch) — no new API, no new WebSocket, no new search logic.
 * Trading itself decides what happens for a guest, same as any other
 * /trading link elsewhere in the app.
 */
export function NavbarSearch() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const { data } = useMarkets();
  const { prices } = useLivePrices();

  const rows = useMemo(() => mergeMarketData(data ?? [], prices), [data, prices]);
  const results = useMemo(
    () => filterBySearch(rows, query).slice(0, RESULT_LIMIT),
    [rows, query]
  );

  return (
    <DropdownMenu.Root onOpenChange={(next) => !next && setQuery("")}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t("nav.searchAria")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-primary/40 hover:text-foreground data-[state=open]:border-primary/40 data-[state=open]:text-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-80 rounded-xl border border-border bg-card p-2 shadow-card"
        >
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted">
                {t("nav.searchNoResults")}
              </div>
            )}
            {results.map((row) => {
              const up = row.change24h >= 0;
              return (
                <DropdownMenu.Item key={row.symbol} asChild>
                  <Link
                    href={`/trading?symbol=${row.symbol}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 outline-none transition-colors hover:bg-foreground/5 data-[highlighted]:bg-foreground/5"
                  >
                    <CoinIcon symbol={row.base} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {row.name}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {row.displaySymbol}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-tabular text-sm text-foreground">
                        {formatPrice(row.price, row.price < 10 ? 4 : 2)}
                      </div>
                      <div
                        className={cn(
                          "font-tabular text-xs",
                          up ? "text-primary" : "text-danger"
                        )}
                      >
                        {formatPercent(row.change24h)}
                      </div>
                    </div>
                  </Link>
                </DropdownMenu.Item>
              );
            })}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
