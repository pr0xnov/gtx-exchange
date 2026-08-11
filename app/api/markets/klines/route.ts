import { NextRequest } from "next/server";
import { fetchKlines } from "@/lib/binance/client";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const ALLOWED_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

export async function GET(req: NextRequest) {
  try {
    const symbol = req.nextUrl.searchParams.get("symbol");
    const interval = req.nextUrl.searchParams.get("interval") ?? "1h";

    if (!symbol) return apiError("symbol query param is required", 400);
    if (!ALLOWED_INTERVALS.includes(interval as (typeof ALLOWED_INTERVALS)[number])) {
      return apiError("Invalid interval", 400);
    }

    const candles = await fetchKlines(
      symbol,
      interval as (typeof ALLOWED_INTERVALS)[number]
    );
    return apiSuccess(candles);
  } catch (error) {
    return handleApiError(error);
  }
}
