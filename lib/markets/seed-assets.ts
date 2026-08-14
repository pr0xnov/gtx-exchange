import type { PrismaClient } from "@prisma/client";
import { MARKET_REGISTRY, fetchTickerSnapshot } from "@/lib/binance/client";

// Fallback baseline price used only if Binance can't be reached at seed
// time (e.g. offline/CI environments) — the live WS service overwrites
// every asset's price within seconds of connecting, so this only needs
// to be a harmless placeholder, not an accurate snapshot.
const FALLBACK_PRICE = 1;

/**
 * Upserts every symbol in MARKET_REGISTRY into `Asset`. Idempotent by
 * construction: `update: {}` means re-running this never overwrites an
 * existing row's price/category — only brand-new symbols get created —
 * so growing MARKET_REGISTRY later and re-seeding is always safe.
 *
 * Extracted from prisma/seed.ts (which still calls this) so it's
 * importable/testable on its own against a real test database, without
 * pulling in seed.ts's script-level `main()` side effect.
 */
export async function seedAssets(prisma: PrismaClient): Promise<number> {
  let snapshots: Record<string, { price: number; changePercent24h: number }> = {};

  try {
    const live = await fetchTickerSnapshot();
    snapshots = Object.fromEntries(live.map((t) => [t.symbol, t]));
  } catch {
    // Offline/CI — fall back to placeholder prices below.
  }

  for (const entry of MARKET_REGISTRY) {
    const snapshot = snapshots[entry.symbol];
    await prisma.asset.upsert({
      where: { symbol: entry.symbol },
      update: {},
      create: {
        symbol: entry.symbol,
        displaySymbol: `${entry.baseAsset}/USD`,
        baseAsset: entry.baseAsset,
        quoteAsset: "USDT",
        category: "Cryptocurrencies",
        lastPrice: snapshot?.price ?? FALLBACK_PRICE,
        change24h: snapshot?.changePercent24h ?? 0,
      },
    });
  }

  return MARKET_REGISTRY.length;
}
