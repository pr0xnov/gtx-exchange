/**
 * Correctness + concurrency tests for the spot limit-order fill engine
 * (server/ws/fill-spot-order.ts), which server/ws/index.ts polls
 * periodically to fill OPEN spot limit orders once the live price
 * crosses them.
 *
 * The critical property under test: the fill engine and a user's own
 * cancel request (POST /api/spot/orders/[id]/cancel) can race on the same
 * OPEN order — the engine runs on a timer independently of the HTTP
 * request lifecycle. Both claim the order via the same
 * `updateMany({ where: { status: "OPEN" } })` pattern used elsewhere in
 * this codebase for exactly this reason, so exactly one of them may ever
 * win, and the reservation is released or consumed exactly once either
 * way — never both, never neither.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { POST as cancelSpotOrder } from "@/app/api/spot/orders/[id]/cancel/route";
import { fillSpotLimitOrder } from "../server/ws/fill-spot-order";
import { resetDatabase, seedAsset, seedSpotWallet, seedUserWithWallet } from "./helpers";

vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

beforeEach(async () => {
  await resetDatabase();
  vi.mocked(requireUser).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function walletOf(userId: string, currency: string) {
  return prisma.spotWallet.findUniqueOrThrow({
    where: { userId_currency: { userId, currency } },
  });
}

async function seedOpenLimitBuy(params: {
  userId: string;
  symbol: string;
  baseCurrency: string;
  quantity: number;
  price: number;
}) {
  const notional = params.quantity * params.price;
  await prisma.spotWallet.update({
    where: { userId_currency: { userId: params.userId, currency: "USDT" } },
    data: { balance: { decrement: notional }, locked: { increment: notional } },
  });
  return prisma.spotOrder.create({
    data: {
      userId: params.userId,
      symbol: params.symbol,
      side: "BUY",
      type: "LIMIT",
      price: params.price,
      quantity: params.quantity,
      status: "OPEN",
    },
  });
}

describe("fillSpotLimitOrder", () => {
  it("fills a BUY order once the price crosses the limit, releasing the reservation and crediting the base currency", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    const asset = await seedAsset(50_000, "FILLBUYUSDT");

    const order = await seedOpenLimitBuy({
      userId: user.id,
      symbol: "FILLBUYUSDT",
      baseCurrency: asset.baseAsset,
      quantity: 0.01,
      price: 40_000,
    });

    const outcome = await fillSpotLimitOrder(prisma, order, {
      currentPrice: 39_000, // <= limit price -> triggers a BUY fill
      baseCurrency: asset.baseAsset,
      quoteCurrency: "USDT",
    });
    expect(outcome).toBe("filled");

    const filled = await prisma.spotOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(filled.status).toBe("FILLED");
    expect(Number(filled.filledQuantity)).toBe(0.01);

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt.balance)).toBe(600); // unchanged since reservation, 1000 - 400
    expect(Number(usdt.locked)).toBe(0); // reservation released

    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base.balance)).toBe(0.01);
  });

  it("does not fill when the price hasn't reached the limit", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    const asset = await seedAsset(50_000, "NOFILLUSDT");

    const order = await seedOpenLimitBuy({
      userId: user.id,
      symbol: "NOFILLUSDT",
      baseCurrency: asset.baseAsset,
      quantity: 0.01,
      price: 40_000,
    });

    const outcome = await fillSpotLimitOrder(prisma, order, {
      currentPrice: 45_000, // above the BUY limit -> not triggered
      baseCurrency: asset.baseAsset,
      quoteCurrency: "USDT",
    });
    expect(outcome).toBe("not-triggered");

    const stillOpen = await prisma.spotOrder.findUniqueOrThrow({
      where: { id: order.id },
    });
    expect(stillOpen.status).toBe("OPEN");

    const usdt = await walletOf(user.id, "USDT");
    expect(Number(usdt.locked)).toBe(400); // untouched
  });

  it("a second fill attempt on an already-FILLED order is a no-op", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    const asset = await seedAsset(50_000, "DBLFILLUSDT");

    const order = await seedOpenLimitBuy({
      userId: user.id,
      symbol: "DBLFILLUSDT",
      baseCurrency: asset.baseAsset,
      quantity: 0.01,
      price: 40_000,
    });

    const params = {
      currentPrice: 39_000,
      baseCurrency: asset.baseAsset,
      quoteCurrency: "USDT",
    };
    const first = await fillSpotLimitOrder(prisma, order, params);
    const second = await fillSpotLimitOrder(prisma, order, params);
    expect(first).toBe("filled");
    expect(second).toBe("already-handled");

    const base = await walletOf(user.id, asset.baseAsset);
    expect(Number(base.balance)).toBe(0.01); // credited exactly once, not twice
  });
});

describe("concurrent cancel vs. fill on the same OPEN spot order", () => {
  it("exactly one wins; the reservation is released or consumed exactly once, never both, never neither", async () => {
    const user = await seedUserWithWallet(0);
    await seedSpotWallet({ userId: user.id, currency: "USDT", balance: 1_000 });
    const asset = await seedAsset(50_000, "RACECANCELUSDT");
    vi.mocked(requireUser).mockResolvedValue(user);

    const order = await seedOpenLimitBuy({
      userId: user.id,
      symbol: "RACECANCELUSDT",
      baseCurrency: asset.baseAsset,
      quantity: 0.01,
      price: 40_000,
    });

    const [cancelRes, fillOutcome] = await Promise.all([
      cancelSpotOrder(new Request("http://test", { method: "POST" }), {
        params: Promise.resolve({ id: order.id }),
      }),
      fillSpotLimitOrder(prisma, order, {
        currentPrice: 39_000,
        baseCurrency: asset.baseAsset,
        quoteCurrency: "USDT",
      }),
    ]);

    const finalOrder = await prisma.spotOrder.findUniqueOrThrow({
      where: { id: order.id },
    });
    const usdt = await walletOf(user.id, "USDT");
    const base = await walletOf(user.id, asset.baseAsset);

    // The reservation must always be fully released, regardless of who won.
    expect(Number(usdt.locked)).toBe(0);

    if (finalOrder.status === "CANCELLED") {
      expect(cancelRes.status).toBe(200);
      expect(fillOutcome).toBe("already-handled");
      expect(Number(usdt.balance)).toBe(1_000); // fully refunded, nothing spent
      expect(Number(base.balance)).toBe(0); // never credited
    } else {
      expect(finalOrder.status).toBe("FILLED");
      expect(cancelRes.status).toBe(400); // "no longer open"
      expect(fillOutcome).toBe("filled");
      expect(Number(usdt.balance)).toBe(600); // spent, not refunded
      expect(Number(base.balance)).toBe(0.01); // credited exactly once
    }
  });
});
