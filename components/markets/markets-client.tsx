"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { useMarkets } from "@/hooks/use-api";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniSparkline } from "@/components/markets/mini-sparkline";
import { Skeleton } from "@/components/shared/skeleton";

const CATEGORIES = [
  "Popular",
  "Forex",
  "Stocks",
  "Cryptocurrencies",
  "Commodities",
  "Indices",
];

export function MarketsClient() {
  const { data, isLoading } = useMarkets();
  const [category, setCategory] = useState("Popular");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((a) => {
      const matchesCategory =
        category === "Popular" || category === "Cryptocurrencies"
          ? true
          : a.category === category;
      const matchesSearch = a.displaySymbol
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [data, category, search]);

  function toggleFavorite(symbol: string) {
  setFavorites((prev) => {
    const next = new Set(prev);

    if (next.has(symbol)) {
      next.delete(symbol);
    } else {
      next.add(symbol);
    }

    return next;
  });
}

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-bold text-foreground">Markets</h1>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                category === c
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-white/5 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search assets"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="w-8 px-4 py-3" />
              <th className="px-2 py-3 font-medium">Instrument</th>
              <th className="px-2 py-3 font-medium">Price</th>
              <th className="px-2 py-3 font-medium">Change</th>
              <th className="hidden px-2 py-3 font-medium sm:table-cell">Chart</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td colSpan={6} className="px-4 py-4">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No assets found in this category.
                </td>
              </tr>
            )}

            {filtered.map((asset) => {
              const up = asset.change24h >= 0;
              return (
                <tr
                  key={asset.id}
                  className="border-b border-border/50 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-4">
                    <button onClick={() => toggleFavorite(asset.symbol)}>
                      <Star
                        className={cn(
                          "h-4 w-4",
                          favorites.has(asset.symbol)
                            ? "fill-primary text-primary"
                            : "text-muted"
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-2 py-4 font-medium text-foreground">
                    {asset.displaySymbol}
                  </td>
                  <td className="px-2 py-4 font-tabular text-foreground">
                    {formatPrice(asset.price, asset.price < 10 ? 4 : 2)}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-4 font-tabular",
                      up ? "text-primary" : "text-danger"
                    )}
                  >
                    {up ? "+" : ""}
                    {asset.change24h.toFixed(2)}%
                  </td>
                  <td className="hidden w-28 px-2 py-4 sm:table-cell">
                    <MiniSparkline positive={up} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button size="sm" asChild>
                      <Link href={`/trading?symbol=${asset.symbol}`}>Trade</Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
