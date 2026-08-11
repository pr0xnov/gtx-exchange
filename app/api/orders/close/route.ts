import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { closePositionSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { calculateUnrealizedPnl } from "@/lib/trading/engine";

// See note in app/api/portfolio/route.ts on why we read from `Asset`
// rather than the in-process price store.

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { positionId } = closePositionSchema.parse(body);

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { asset: true },
    });

    if (!position || position.userId !== user.id) {
      return apiError("Position not found", 404);
    }
    if (position.status !== "OPEN") {
      return apiError("Position is already closed", 400);
    }

    const currentPrice = Number(position.asset.lastPrice) || Number(position.currentPrice);
    const pnl = calculateUnrealizedPnl(
      position.side,
      Number(position.amount),
      Number(position.entryPrice),
      currentPrice
    );

    const result = await prisma.$transaction(async (tx) => {
      const closed = await tx.position.update({
        where: { id: position.id },
        data: {
          status: "CLOSED",
          currentPrice,
          realizedPnl: pnl,
          closedAt: new Date(),
        },
      });

      await tx.trade.create({
        data: {
          userId: user.id,
          assetId: position.assetId,
          positionId: position.id,
          side: position.side,
          amount: position.amount,
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          pnl,
          leverage: position.leverage,
        },
      });

      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: Number(position.margin) + pnl } },
      });

      return closed;
    });

    return apiSuccess({ position: result, pnl });
  } catch (error) {
    return handleApiError(error);
  }
}
