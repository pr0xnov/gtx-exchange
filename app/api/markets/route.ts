import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api-response";

// Prices come from the `Asset` table, which the `ws` service keeps in sync
// with Binance roughly every 5 seconds. The browser gets sub-second updates
// separately via the live WebSocket relay (see hooks/use-live-prices.ts);
// this REST endpoint is the initial/fallback snapshot.

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({ orderBy: { symbol: "asc" } });

    const data = assets.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      displaySymbol: a.displaySymbol || a.symbol,
      category: a.category,
      price: Number(a.lastPrice),
      change24h: Number(a.change24h),
    }));

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
