import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { calculateUnrealizedPnl, calculatePortfolioSummary } from "@/lib/trading/engine";

// NOTE: live prices are read from the `Asset` table rather than the
// in-process price store, because this route runs inside the `web`
// container while Binance prices are streamed into the separate `ws`
// container's memory. The ws service persists prices to `Asset` every
// ~5s, which is the source of truth shared across both containers.

export async function GET() {
  try {
    const user = await requireUser();

    const positions = await prisma.position.findMany({
      where: { userId: user.id, status: "OPEN" },
      include: { asset: true },
    });

    const enriched = positions.map((p) => {
      const live = Number(p.asset.lastPrice) || Number(p.currentPrice);
      const unrealizedPnl = calculateUnrealizedPnl(
        p.side,
        Number(p.amount),
        Number(p.entryPrice),
        live
      );
      return { margin: Number(p.margin), unrealizedPnl };
    });

    const balance = Number(user.wallet?.balance ?? 0);
    const credit = Number(user.wallet?.credit ?? 0);

    const summary = calculatePortfolioSummary(balance, credit, enriched);

    return apiSuccess(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
