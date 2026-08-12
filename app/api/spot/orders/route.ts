import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { createSpotOrderSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

// Spot trading is unleveraged: BUY spends USDT to acquire units of the
// asset, SELL converts units of the asset back into USDT. There is no
// margin, no position, no liquidation — just a wallet balance and a
// SpotHolding quantity. Prices come from `Asset.lastPrice`, same as the
// futures order routes — see the note in app/api/portfolio/route.ts on
// why the web container reads prices from the DB rather than the ws
// container's in-memory store.

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await prisma.spotOrder.findMany({
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

    const limit = rateLimit(`spot-orders:${user.id}`, 30, 60_000);
    if (!limit.success) return apiError("Too many orders. Slow down.", 429);

    const body = await req.json();
    const input = createSpotOrderSchema.parse(body);

    const asset = await prisma.asset.findUnique({ where: { symbol: input.symbol } });
    if (!asset) return apiError("Unknown trading asset", 404);

    const price = Number(asset.lastPrice);
    if (!price || price <= 0) {
      return apiError("Live price unavailable for this asset. Try again shortly.", 503);
    }

    const total = input.quantity * price;

    if (input.side === "BUY") {
      const result = await prisma.$transaction(async (tx) => {
        // Atomically check-and-debit: same conditional UPDATE pattern used
        // by the leveraged order routes, so concurrent buys can never
        // overdraw the wallet.
        const debited = await tx.wallet.updateMany({
          where: { userId: user.id, balance: { gte: total } },
          data: { balance: { decrement: total } },
        });
        if (debited.count === 0) return null;

        await tx.spotHolding.upsert({
          where: { userId_assetId: { userId: user.id, assetId: asset.id } },
          update: { quantity: { increment: input.quantity } },
          create: { userId: user.id, assetId: asset.id, quantity: input.quantity },
        });

        return tx.spotOrder.create({
          data: {
            userId: user.id,
            assetId: asset.id,
            side: "BUY",
            quantity: input.quantity,
            price,
            total,
          },
        });
      });

      if (!result) {
        return apiError("Insufficient balance for this purchase", 400);
      }
      return apiSuccess(result, 201);
    }

    // SELL
    const result = await prisma.$transaction(async (tx) => {
      // Atomically check-and-debit the holding: can never sell more than
      // is actually owned, even under concurrent sell requests.
      const debited = await tx.spotHolding.updateMany({
        where: { userId: user.id, assetId: asset.id, quantity: { gte: input.quantity } },
        data: { quantity: { decrement: input.quantity } },
      });
      if (debited.count === 0) return null;

      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: total } },
      });

      return tx.spotOrder.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          side: "SELL",
          quantity: input.quantity,
          price,
          total,
        },
      });
    });

    if (!result) {
      return apiError("Insufficient balance for this sale", 400);
    }
    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
