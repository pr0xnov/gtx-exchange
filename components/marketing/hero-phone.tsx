"use client";

import { motion } from "framer-motion";
import { CoinIcon } from "@/components/markets/coin-icon";
import { useLocale } from "@/lib/i18n/locale-context";

// Illustrative hero visual only — static marketing numbers, never the
// current user's real balance (a guest has none, and an authenticated
// user's own figures belong on /wallet, not a public landing page).
const FLOATING_ASSETS = [
  {
    symbol: "BTC",
    pair: "BTC/USDT",
    price: "67,284.10",
    change: "+2.45%",
    top: "6%",
    left: "-10%",
    delay: 0,
  },
  {
    symbol: "ETH",
    pair: "ETH/USDT",
    price: "3,642.32",
    change: "+1.68%",
    top: "58%",
    left: "-16%",
    delay: 1.2,
  },
  {
    symbol: "SOL",
    pair: "SOL/USDT",
    price: "152.35",
    change: "+3.21%",
    top: "14%",
    left: "92%",
    delay: 0.6,
  },
  {
    symbol: "BNB",
    pair: "BNB/USDT",
    price: "583.21",
    change: "+1.05%",
    top: "68%",
    left: "86%",
    delay: 1.8,
  },
];

export function HeroPhone() {
  const { t } = useLocale();

  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-sm items-center justify-center">
      <div className="absolute h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 h-96 w-52 rounded-[2.2rem] border-4 border-[#1F2937] bg-[#0D1420] p-2 shadow-elevated"
      >
        <div className="flex h-full flex-col rounded-[1.6rem] bg-[#0B0F17] p-3">
          <div className="mb-3 flex items-center justify-between text-[10px] text-muted">
            <span>9:41</span>
            <span className="font-semibold text-foreground">GTX</span>
          </div>

          <div className="mb-1 text-[10px] text-muted">
            {t("marketing.home.phone.balanceLabel")}
          </div>
          <div className="mb-3 text-lg font-bold text-foreground">1,200.00 USDT</div>

          <div className="space-y-2 rounded-xl bg-white/[0.03] p-2.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-muted">{t("marketing.home.phone.depositLabel")}</span>
              <span className="font-tabular text-foreground">1,000.00 USDT</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">{t("marketing.home.phone.bonusLabel")}</span>
              <span className="font-tabular text-primary">+200.00 USDT</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <span className="text-muted">{t("marketing.home.phone.totalLabel")}</span>
              <span className="font-tabular font-semibold text-foreground">
                1,200.00 USDT
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-1 items-end gap-1">
            {[40, 55, 35, 70, 50, 85, 60, 95, 75, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-primary/20 to-primary"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {FLOATING_ASSETS.map((a, i) => (
        <motion.div
          key={a.symbol}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
          className="absolute z-20 hidden animate-float items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-elevated backdrop-blur sm:flex"
          style={{ top: a.top, left: a.left, animationDelay: `${a.delay}s` }}
        >
          <CoinIcon symbol={a.symbol} />
          <div>
            <div className="text-xs font-semibold text-foreground">{a.pair}</div>
            <div className="font-tabular text-[10px] text-muted">{a.price}</div>
          </div>
          <div className="font-tabular text-[10px] text-primary">{a.change}</div>
        </motion.div>
      ))}
    </div>
  );
}
