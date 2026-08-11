import { TRACKED_SYMBOLS, TickerSnapshot } from "@/lib/binance/client";

/**
 * Process-local cache of the latest known price per symbol.
 * The WS relay service (server/ws) writes to this; API routes read from it
 * to compute PnL, execute market orders, etc. without hitting Binance again.
 */
class PriceStore {
  private prices = new Map<string, TickerSnapshot>();

  set(snapshot: TickerSnapshot) {
    this.prices.set(snapshot.symbol, snapshot);
  }

  setMany(snapshots: TickerSnapshot[]) {
    for (const s of snapshots) this.set(s);
  }

  get(symbol: string): TickerSnapshot | undefined {
    return this.prices.get(symbol);
  }

  getPrice(symbol: string): number | undefined {
    return this.prices.get(symbol)?.price;
  }

  all(): TickerSnapshot[] {
    return [...TRACKED_SYMBOLS].map(
      (s) => this.prices.get(s) ?? { symbol: s, price: 0, changePercent24h: 0, high24h: 0, low24h: 0, volume24h: 0 }
    );
  }

  isReady(): boolean {
    return this.prices.size > 0;
  }
}

const globalForStore = globalThis as unknown as { priceStore: PriceStore | undefined };

export const priceStore = globalForStore.priceStore ?? new PriceStore();
if (process.env.NODE_ENV !== "production") globalForStore.priceStore = priceStore;
