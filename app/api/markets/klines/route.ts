import { NextRequest } from "next/server";
import { fetchKlines, KLINE_INTERVALS, KlineInterval } from "@/lib/binance/client";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 500;

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol");
    const interval = req.nextUrl.searchParams.get("interval") ?? "1h";
    const endTimeParam = req.nextUrl.searchParams.get("endTime");
    const limitParam = req.nextUrl.searchParams.get("limit");

    if (!symbol) return apiError("symbol query param is required", 400);
    if (!KLINE_INTERVALS.includes(interval as KlineInterval)) {
      return apiError("Invalid interval", 400);
    }

    let endTime: number | undefined;
    if (endTimeParam !== null) {
      endTime = Number(endTimeParam);
      if (!Number.isFinite(endTime) || endTime <= 0) {
        return apiError("Invalid endTime", 400);
      }
    }

    let limit = DEFAULT_LIMIT;
    if (limitParam !== null) {
      const parsed = Number(limitParam);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return apiError("Invalid limit", 400);
      }
      limit = Math.min(parsed, MAX_LIMIT);
    }

    // Chart requests older pages (scroll-back) via `endTime`, letting the
    // user reach at least a year of history — see
    // components/trading/candlestick-chart.tsx.
    const candles = await fetchKlines(symbol, interval as KlineInterval, limit, endTime);
    return apiSuccess(candles);
  } catch (error) {
    return handleApiError(error);
  }
}
