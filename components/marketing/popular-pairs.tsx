"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MiniSparkline } from "@/components/markets/mini-sparkline";
import { useLocale } from "@/lib/i18n/locale-context";

const PAIRS = [
  { symbol: "BTC/USD", price: "66,241.3", change: 1.32, up: true },
  { symbol: "ETH/USD", price: "3,221.35", change: 0.76, up: true },
  { symbol: "EUR/USD", price: "1.08743", change: 0.24, up: true },
  { symbol: "GOLD", price: "2,358.45", change: 0.35, up: true },
  { symbol: "OIL", price: "78.245", change: -0.11, up: false },
];

export function PopularPairs() {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 className="font-semibold text-foreground">
          {t("marketing.popularPairs.title")}
        </h2>
        <Link href="/markets" className="text-sm text-primary hover:underline">
          {t("marketing.popularPairs.viewAll")}
        </Link>
      </div>
      <div className="divide-y divide-border">
        {PAIRS.map((p) => (
          <div
            key={p.symbol}
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.02]"
          >
            <div className="w-32 font-medium text-foreground">{p.symbol}</div>
            <div className="font-tabular w-24 text-sm text-foreground">{p.price}</div>
            <div
              className={`font-tabular w-20 text-sm ${p.up ? "text-primary" : "text-danger"}`}
            >
              {p.up ? "+" : ""}
              {p.change}%
            </div>
            <div className="hidden w-24 sm:block">
              <MiniSparkline positive={p.up} />
            </div>
            <Button size="sm" asChild>
              <Link href="/trading">{t("marketing.popularPairs.tradeButton")}</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
