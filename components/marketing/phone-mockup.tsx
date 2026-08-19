"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

const FLOATING_ASSETS = [
  { symbol: "AAPL", top: "8%", left: "-8%", delay: 0 },
  { symbol: "TSLA", top: "62%", left: "-14%", delay: 1.2 },
  { symbol: "AMZN", top: "20%", left: "94%", delay: 0.6 },
  { symbol: "GOOG", top: "70%", left: "88%", delay: 1.8 },
];

export function PhoneMockup() {
  const { t } = useLocale();
  return (
    <div className="relative mx-auto flex h-[420px] w-full max-w-sm items-center justify-center">
      {/* Glow behind phone */}
      <div className="absolute h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

      {/* Phone body */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 h-96 w-52 rounded-[2.2rem] border-4 border-[#1F2937] bg-[#0D1420] p-2 shadow-elevated"
      >
        <div className="flex h-full flex-col rounded-[1.6rem] bg-[#0B0F17] p-3">
          <div className="mb-3 flex items-center justify-between text-[10px] text-muted">
            <span>9:41</span>
            <span>GTX</span>
          </div>
          <div className="mb-2 text-xs text-muted">
            {t("marketing.phone.portfolioValue")}
          </div>
          <div className="mb-4 text-xl font-bold text-foreground">$14,382.90</div>
          <div className="flex flex-1 items-end gap-1">
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

      {/* Floating asset cards */}
      {FLOATING_ASSETS.map((a, i) => (
        <motion.div
          key={a.symbol}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
          className="absolute z-20 hidden animate-float items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-elevated backdrop-blur sm:flex"
          style={{ top: a.top, left: a.left, animationDelay: `${a.delay}s` }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {a.symbol[0]}
          </div>
          <div>
            <div className="text-xs font-semibold text-foreground">{a.symbol}</div>
            <div className="flex items-center gap-1 text-[10px] text-primary">
              <TrendingUp className="h-2.5 w-2.5" />
              +2.4%
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
