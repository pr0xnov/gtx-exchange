"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CoinIcon } from "@/components/markets/coin-icon";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";
import { MARKET_REGISTRY } from "@/lib/binance/client";
import { cn } from "@/lib/utils";

/**
 * Compact searchable market picker for /analytics's "Динамика рынка"
 * chart — a plain native popover (no Radix), since a search input living
 * inside a Radix DropdownMenu/Select fights that library's own
 * roving-focus keyboard handling. Built from the project's existing
 * MARKET_REGISTRY (the same ~95-symbol list /markets and Trading already
 * use) — not a separate hardcoded list — and the existing Input/CoinIcon
 * primitives.
 */
export function MarketSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (symbol: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MARKET_REGISTRY;
    return MARKET_REGISTRY.filter(
      (entry) =>
        entry.baseAsset.toLowerCase().includes(q) ||
        entry.symbol.toLowerCase().includes(q) ||
        entry.name.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = MARKET_REGISTRY.find((entry) => entry.symbol === value);
  const base = selected?.baseAsset ?? value.replace(/USDT$/, "");

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
      >
        <CoinIcon symbol={base} />
        {base}/USDT
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 max-w-[85vw] rounded-xl border border-border bg-card p-2 shadow-card">
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("analytics.dynamics.searchPlaceholder")}
            className="h-9"
          />
          <div className="mt-2 max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-2 text-center text-sm text-muted">{t("common.noData")}</p>
            )}
            {filtered.map((entry) => (
              <button
                key={entry.symbol}
                type="button"
                onClick={() => {
                  onChange(entry.symbol);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-foreground/5",
                  entry.symbol === value ? "text-primary" : "text-foreground"
                )}
              >
                <CoinIcon symbol={entry.baseAsset} />
                {entry.baseAsset}/USDT
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
