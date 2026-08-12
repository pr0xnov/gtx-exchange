/**
 * Atomically fills a single OPEN spot LIMIT order once the live price
 * crosses its limit price — or leaves it untouched if the price hasn't
 * been reached yet. Extracted out of the polling loop in
 * server/ws/index.ts, mirroring server/ws/fill-limit-order.ts's pattern
 * for the futures side, so it's independently testable.
 */
import type { PrismaClient, SpotOrder } from "@prisma/client";

export type SpotFillOutcome = "filled" | "already-handled" | "not-triggered";

export async function fillSpotLimitOrder(
  prisma: PrismaClient,
  order: SpotOrder,
  params: { currentPrice: number; baseCurrency: string; quoteCurrency: string }
): Promise<SpotFillOutcome> {
  const { currentPrice, baseCurrency, quoteCurrency } = params;
  const limitPrice = Number(order.price);
  const quantity = Number(order.quantity);

  // BUY limit fills when price drops to/through the limit; SELL limit
  // fills when price rises to/through the limit — same semantics as the
  // futures limit-order engine.
  const shouldFill =
    order.side === "BUY" ? currentPrice <= limitPrice : currentPrice >= limitPrice;
  if (!shouldFill) return "not-triggered";

  // Execute exactly at the limit price — this is also exactly the
  // notional that was reserved into `locked` when the order was placed,
  // so releasing it here is an exact cancellation of that reservation.
  const notional = quantity * limitPrice;

  return prisma.$transaction(async (tx) => {
    // Atomically claim the order: only succeeds if it's still OPEN. The
    // user's own cancel request (POST /api/spot/orders/[id]/cancel) could
    // be racing this exact fill — only one of "cancel" or "fill" may win.
    const claimed = await tx.spotOrder.updateMany({
      where: { id: order.id, status: "OPEN" },
      data: { status: "FILLED", filledQuantity: quantity },
    });
    if (claimed.count === 0) return "already-handled";

    if (order.side === "BUY") {
      // Release the reserved quote currency and credit the base currency.
      await tx.spotWallet.update({
        where: { userId_currency: { userId: order.userId, currency: quoteCurrency } },
        data: { locked: { decrement: notional } },
      });
      await tx.spotWallet.upsert({
        where: { userId_currency: { userId: order.userId, currency: baseCurrency } },
        update: { balance: { increment: quantity } },
        create: { userId: order.userId, currency: baseCurrency, balance: quantity },
      });
    } else {
      // Release the reserved base currency and credit the quote currency.
      await tx.spotWallet.update({
        where: { userId_currency: { userId: order.userId, currency: baseCurrency } },
        data: { locked: { decrement: quantity } },
      });
      await tx.spotWallet.upsert({
        where: { userId_currency: { userId: order.userId, currency: quoteCurrency } },
        update: { balance: { increment: notional } },
        create: { userId: order.userId, currency: quoteCurrency, balance: notional },
      });
    }

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "Spot limit order filled",
        message: `${order.symbol} ${order.side} limit order filled at ${limitPrice}`,
      },
    });

    return "filled";
  });
}
