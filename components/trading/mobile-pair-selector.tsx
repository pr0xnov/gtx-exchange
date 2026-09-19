"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CoinIcon } from "@/components/markets/coin-icon";
import { cn, formatPrice } from "@/lib/utils";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { AssetWatchlist } from "@/components/trading/asset-watchlist";
import { useLocale } from "@/lib/i18n/locale-context";
import type { LiveTicker } from "@/hooks/use-live-prices";

/**
 * Mobile-only replacement for the desktop AssetWatchlist sidebar (which
 * stays exactly as-is, `hidden` below `lg`) — a compact current-pair bar
 * that opens the SAME AssetWatchlist (search/favorites/price/24h%,
 * hooks/use-favorites.ts and all) inside a drawer instead of a permanent
 * 256px-wide column, which is what actually made mobile Trading unusable
 * (no room left for the chart). Only mounts AssetWatchlist while the
 * drawer is open, not permanently in the background.
 */
export function MobilePairSelector({
  symbol,
  displayName,
  ticker,
  prices,
  onSelect,
}: {
  symbol: string;
  displayName: string;
  ticker?: LiveTicker;
  prices: Record<string, LiveTicker>;
  onSelect: (symbol: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const base = displayName.split("/")[0] ?? displayName;
  const up = (ticker?.changePercent24h ?? 0) >= 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between border-b border-border px-4 py-3 lg:hidden"
      >
        <span className="flex items-center gap-2">
          <CoinIcon symbol={base} />
          <span className="text-sm font-semibold text-foreground">{displayName}</span>
          {ticker && (
            <span
              className={cn(
                "font-tabular text-sm font-bold",
                up ? "text-primary" : "text-danger"
              )}
            >
              {formatPrice(ticker.price, ticker.price < 10 ? 4 : 2)}
            </span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={t("trading.watchlist.selectPair")}
        side="left"
      >
        <div className="-mx-4 -my-4 h-[calc(100%+2rem)]">
          <AssetWatchlist
            prices={prices}
            selected={symbol}
            onSelect={(s) => {
              onSelect(s);
              setOpen(false);
            }}
            className="h-full w-full border-r-0"
          />
        </div>
      </MobileDrawer>
    </>
  );
}
