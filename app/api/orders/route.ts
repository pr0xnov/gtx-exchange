import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { createOrderSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { calculateMargin, calculateLiquidationPrice } from "@/lib/trading/engine";
import { rateLimit } from "@/lib/rate-limit";

// See note in app/api/portfolio/route.ts on why we read from `Asset`
// rather than the in-process price store.

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { asset: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return apiSuccess(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const limit = rateLimit(`orders:${user.id}`, 30, 60_000);
    if (!limit.success) return apiError("Too many orders. Slow down.", 429);

    const body = await req.json();
    const input = createOrderSchema.parse(body);

    const asset = await prisma.asset.findUnique({ where: { symbol: input.symbol } });
    if (!asset) return apiError("Unknown trading asset", 404);

    const marketPrice = Number(asset.lastPrice);
    if (!marketPrice || marketPrice <= 0) {
      return apiError("Live price unavailable for this asset. Try again shortly.", 503);
    }

    // Limit orders are queued as PENDING; the market-data service fills them
    // when the live price crosses the limit price.
    if (input.type === "LIMIT") {
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type: "LIMIT",
          side: input.side,
          amount: input.amount,
          leverage: input.leverage,
          limitPrice: input.limitPrice,
          takeProfit: input.takeProfit,
          stopLoss: input.stopLoss,
          status: "PENDING",
        },
      });
      return apiSuccess(order, 201);
    }

    // MARKET order: execute immediately at current price.
    const executionPrice = marketPrice;
    const side = input.side === "BUY" ? "LONG" : "SHORT";
    const margin = calculateMargin(input.amount, executionPrice, input.leverage);
    const liquidationPrice = calculateLiquidationPrice(
      side,
      executionPrice,
      input.leverage
    );

    const result = await prisma.$transaction(async (tx) => {
      // Atomically check-and-reserve the margin before creating anything.
      // The check and the debit are a single conditional UPDATE, so this
      // can never overdraw the wallet under concurrent order/withdrawal
      // requests — and if it fails, no order/position rows are created.
      const debited = await tx.wallet.updateMany({
        where: { userId: user.id, balance: { gte: margin } },
        data: { balance: { decrement: margin } },
      });

      if (debited.count === 0) {
        return null;
      }

      const order = await tx.order.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type: "MARKET",
          side: input.side,
          amount: input.amount,
          leverage: input.leverage,
          takeProfit: input.takeProfit,
          stopLoss: input.stopLoss,
          status: "FILLED",
          filledAt: new Date(),
        },
      });

      const position = await tx.position.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          orderId: order.id,
          side,
          amount: input.amount,
          leverage: input.leverage,
          entryPrice: executionPrice,
          currentPrice: executionPrice,
          takeProfit: input.takeProfit,
          stopLoss: input.stopLoss,
          margin,
          liquidationPrice,
          status: "OPEN",
        },
      });

      return position;
    });

    if (!result) {
      return apiError("Insufficient balance to open this position", 400);
    }

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
