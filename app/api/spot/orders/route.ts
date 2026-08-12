import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { createSpotOrderSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";
import { ensureSpotWallet } from "@/lib/spot/wallet";

// Spot trading is unleveraged and settles against a dedicated per-currency
// SpotWallet ledger (USDT, BTC, ETH, ...) — entirely separate from the
// futures-margin `Wallet`. MARKET orders execute immediately at
// `Asset.lastPrice` (same price source of truth as the futures routes —
// see the note in app/api/portfolio/route.ts). LIMIT orders reserve funds
// into `SpotWallet.locked` and stay OPEN until the ws engine fills them
// (server/ws) or the user cancels them (POST .../[id]/cancel).

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await prisma.spotOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
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

    const baseCurrency = asset.baseAsset;
    const quoteCurrency = asset.quoteAsset;

    let executionPrice: number;
    if (input.type === "MARKET") {
      executionPrice = Number(asset.lastPrice);
      if (!executionPrice || executionPrice <= 0) {
        return apiError("Live price unavailable for this asset. Try again shortly.", 503);
      }
    } else {
      // Guaranteed present by createSpotOrderSchema's refine for LIMIT.
      executionPrice = input.price as number;
    }

    const notional = input.quantity * executionPrice;
    const isMarket = input.type === "MARKET";

    if (input.side === "BUY") {
      const result = await prisma.$transaction(async (tx) => {
        await ensureSpotWallet(tx, user.id, quoteCurrency);

        // Atomically check-and-debit the quote currency in one conditional
        // UPDATE — a MARKET buy spends it outright; a LIMIT buy moves it
        // into `locked` as a reservation instead, released or consumed
        // when the order later fills or is cancelled. Concurrent orders
        // can therefore never overdraw the wallet.
        const debited = await tx.spotWallet.updateMany({
          where: { userId: user.id, currency: quoteCurrency, balance: { gte: notional } },
          data: isMarket
            ? { balance: { decrement: notional } }
            : { balance: { decrement: notional }, locked: { increment: notional } },
        });
        if (debited.count === 0) return null;

        if (isMarket) {
          await ensureSpotWallet(tx, user.id, baseCurrency);
          await tx.spotWallet.update({
            where: { userId_currency: { userId: user.id, currency: baseCurrency } },
            data: { balance: { increment: input.quantity } },
          });
        }

        return tx.spotOrder.create({
          data: {
            userId: user.id,
            symbol: input.symbol,
            side: "BUY",
            type: input.type,
            price: executionPrice,
            quantity: input.quantity,
            filledQuantity: isMarket ? input.quantity : 0,
            status: isMarket ? "FILLED" : "OPEN",
          },
        });
      });

      if (!result) return apiError("Insufficient balance for this order", 400);
      return apiSuccess(result, 201);
    }

    // SELL
    const result = await prisma.$transaction(async (tx) => {
      await ensureSpotWallet(tx, user.id, baseCurrency);

      // Same atomic check-and-debit pattern, on the base currency: a
      // MARKET sell spends it outright, a LIMIT sell reserves it into
      // `locked` — never lets a concurrent sell oversell the holding.
      const debited = await tx.spotWallet.updateMany({
        where: {
          userId: user.id,
          currency: baseCurrency,
          balance: { gte: input.quantity },
        },
        data: isMarket
          ? { balance: { decrement: input.quantity } }
          : {
              balance: { decrement: input.quantity },
              locked: { increment: input.quantity },
            },
      });
      if (debited.count === 0) return null;

      if (isMarket) {
        await ensureSpotWallet(tx, user.id, quoteCurrency);
        await tx.spotWallet.update({
          where: { userId_currency: { userId: user.id, currency: quoteCurrency } },
          data: { balance: { increment: notional } },
        });
      }

      return tx.spotOrder.create({
        data: {
          userId: user.id,
          symbol: input.symbol,
          side: "SELL",
          type: input.type,
          price: executionPrice,
          quantity: input.quantity,
          filledQuantity: isMarket ? input.quantity : 0,
          status: isMarket ? "FILLED" : "OPEN",
        },
      });
    });

    if (!result) return apiError("Insufficient balance for this order", 400);
    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
