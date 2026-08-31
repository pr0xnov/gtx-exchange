import { CoinIcon } from "@/components/markets/coin-icon";
import { getServerTranslator } from "@/lib/i18n/get-locale";

// Marketing visual only — illustrative, static figures, never a real
// account's balance/orders/assets/PnL (this page has no access to the
// current user's data, and wouldn't use it here even if it did).
const ASSET_ROWS = [
  { symbol: "BTC", pair: "BTC/USDT", change: "+2.45%", up: true },
  { symbol: "ETH", pair: "ETH/USDT", change: "+1.68%", up: true },
  { symbol: "SOL", pair: "SOL/USDT", change: "-1.12%", up: false },
];

export async function AboutDashboardPreview() {
  const t = await getServerTranslator();

  const METRICS = [
    { label: t("marketing.about.platform.availableBalance"), value: "5,240.80 USDT" },
    { label: t("marketing.about.platform.inOrders"), value: "1,250.00 USDT" },
    { label: t("marketing.about.platform.assetsValue"), value: "8,490.32 USDT" },
    { label: t("marketing.about.platform.pnl"), value: "+342.16 USDT", positive: true },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-elevated sm:p-8">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative grid gap-4 sm:grid-cols-2">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-surface/60 p-4"
          >
            <div className="text-xs text-muted">{m.label}</div>
            <div
              className={`font-tabular mt-1.5 text-lg font-bold sm:text-xl ${
                m.positive ? "text-primary" : "text-foreground"
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-4 divide-y divide-border rounded-2xl border border-border bg-surface/60">
        {ASSET_ROWS.map((row) => (
          <div key={row.symbol} className="flex items-center gap-3 px-4 py-3">
            <CoinIcon symbol={row.symbol} />
            <div className="text-sm font-medium text-foreground">{row.pair}</div>
            <div
              className={`font-tabular ml-auto text-sm ${
                row.up ? "text-primary" : "text-danger"
              }`}
            >
              {row.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
