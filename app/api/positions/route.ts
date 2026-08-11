import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { calculateUnrealizedPnl, calculatePnlPercent } from "@/lib/trading/engine";

// See note in app/api/portfolio/route.ts on why we read from `Asset`
// rather than the in-process price store.

export async function GET() {
  try {
    const user = await requireUser();

    const positions = await prisma.position.findMany({
      where: { userId: user.id, status: "OPEN" },
      include: { asset: true },
      orderBy: { openedAt: "desc" },
    });

    const data = positions.map((p) => {
      const currentPrice = Number(p.asset.lastPrice) || Number(p.currentPrice);
      const pnl = calculateUnrealizedPnl(
        p.side,
        Number(p.amount),
        Number(p.entryPrice),
        currentPrice
      );
      const pnlPercent = calculatePnlPercent(
        p.side,
        Number(p.entryPrice),
        currentPrice,
        p.leverage
      );

      return {
        id: p.id,
        symbol: p.asset.symbol,
        displaySymbol: p.asset.displaySymbol || p.asset.symbol,
        side: p.side,
        amount: Number(p.amount),
        leverage: p.leverage,
        entryPrice: Number(p.entryPrice),
        currentPrice,
        takeProfit: p.takeProfit ? Number(p.takeProfit) : null,
        stopLoss: p.stopLoss ? Number(p.stopLoss) : null,
        margin: Number(p.margin),
        liquidationPrice: p.liquidationPrice ? Number(p.liquidationPrice) : null,
        pnl,
        pnlPercent,
        openedAt: p.openedAt,
      };
    });

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
