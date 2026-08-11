/**
 * Atomically fills — or cancels, if margin is no longer sufficient — a
 * single PENDING limit order. Extracted out of the polling loop in
 * server/ws/index.ts so it can be exercised directly by tests (see
 * tests/race-conditions.test.ts) without needing the WebSocket server or a
 * live Binance connection running.
 */
import type { Order, PrismaClient } from "@prisma/client";
import {
  calculateMargin,
  calculateLiquidationPrice,
  Side,
} from "../../lib/trading/engine";

export type FillOutcome = "filled" | "already-handled" | "insufficient-margin";

export async function fillLimitOrder(
  prisma: PrismaClient,
  order: Order,
  params: { executionPrice: number; symbol: string }
): Promise<FillOutcome> {
  const side: Side = order.side === "BUY" ? "LONG" : "SHORT";
  const margin = calculateMargin(
    Number(order.amount),
    params.executionPrice,
    order.leverage
  );
  const liquidationPrice = calculateLiquidationPrice(
    side,
    params.executionPrice,
    order.leverage
  );

  return prisma.$transaction(async (tx) => {
    // Atomically claim the order: only succeeds if it is still PENDING.
    // Prevents this function from filling the same order twice if it is
    // invoked concurrently for it (e.g. two overlapping polling ticks).
    const claim = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "FILLED", filledAt: new Date() },
    });

    if (claim.count === 0) return "already-handled";

    // Atomically check-and-debit the margin: the check and the
    // reservation of funds are the same conditional UPDATE, so this can
    // never drive the wallet negative even if a withdrawal or another
    // order is racing it concurrently.
    const debited = await tx.wallet.updateMany({
      where: { userId: order.userId, balance: { gte: margin } },
      data: { balance: { decrement: margin } },
    });

    if (debited.count === 0) {
      // Not enough margin anymore — revert the claim to CANCELLED instead
      // of leaving the order FILLED with no position behind it.
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", filledAt: null },
      });
      return "insufficient-margin";
    }

    await tx.position.create({
      data: {
        userId: order.userId,
        assetId: order.assetId,
        orderId: order.id,
        side,
        amount: order.amount,
        leverage: order.leverage,
        entryPrice: params.executionPrice,
        currentPrice: params.executionPrice,
        takeProfit: order.takeProfit,
        stopLoss: order.stopLoss,
        margin,
        liquidationPrice,
        status: "OPEN",
      },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Limit order filled",
        message: `${params.symbol} ${order.side} limit order filled at ${params.executionPrice}`,
      },
    });

    return "filled";
  });
}
