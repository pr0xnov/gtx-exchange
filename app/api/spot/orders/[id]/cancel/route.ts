import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.spotOrder.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return apiError("Order not found", 404);
    }
    if (order.status !== "OPEN") {
      return apiError("Only open orders can be cancelled", 400);
    }

    const asset = await prisma.asset.findUnique({ where: { symbol: order.symbol } });
    if (!asset) return apiError("Unknown trading asset", 404);

    const reservedCurrency = order.side === "BUY" ? asset.quoteAsset : asset.baseAsset;
    const reservedAmount =
      order.side === "BUY"
        ? Number(order.price) * Number(order.quantity)
        : Number(order.quantity);

    const result = await prisma.$transaction(async (tx) => {
      // Atomically claim the order: only succeeds if it is still OPEN.
      // The limit-order fill engine (server/ws) could be filling this
      // exact order right now — only one of "cancel" or "fill" may win,
      // and the loser must never also release/consume the reservation.
      const claimed = await tx.spotOrder.updateMany({
        where: { id: order.id, status: "OPEN" },
        data: { status: "CANCELLED" },
      });
      if (claimed.count === 0) return null;

      await tx.spotWallet.update({
        where: { userId_currency: { userId: user.id, currency: reservedCurrency } },
        data: {
          locked: { decrement: reservedAmount },
          balance: { increment: reservedAmount },
        },
      });

      return tx.spotOrder.findUniqueOrThrow({ where: { id: order.id } });
    });

    if (!result) {
      return apiError("Order is no longer open", 400);
    }
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
