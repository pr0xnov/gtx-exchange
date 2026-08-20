import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * Every figure here is a real aggregate query against the same tables the
 * rest of the app already reads/writes — no mock data, no numbers
 * invented for display purposes. Trading Volume is the notional
 * (price × filledQuantity) of every filled Spot order, all-time — the
 * same fills lib/spot/cost-basis.ts already sources Wallet/Account's own
 * PnL from.
 */
export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeUsers,
      usdtWallets,
      filledOrders,
      openOrders,
      deposits,
      withdrawals,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.spotWallet.findMany({
        where: { currency: "USDT" },
        select: { balance: true, locked: true },
      }),
      prisma.spotOrder.findMany({
        where: { filledQuantity: { gt: 0 } },
        select: { price: true, filledQuantity: true },
      }),
      prisma.spotOrder.count({ where: { status: "OPEN" } }),
      prisma.transaction.aggregate({
        where: { type: "DEPOSIT", status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { type: "WITHDRAWAL", status: "COMPLETED" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalBalance = usdtWallets.reduce(
      (sum, w) => sum + Number(w.balance) + Number(w.locked),
      0
    );
    const tradingVolume = filledOrders.reduce(
      (sum, o) => sum + Number(o.price) * Number(o.filledQuantity),
      0
    );

    return apiSuccess({
      totalUsers,
      activeUsers,
      totalBalance,
      tradingVolume,
      completedTrades: filledOrders.length,
      openOrders,
      deposits: { count: deposits._count, total: Number(deposits._sum.amount ?? 0) },
      withdrawals: {
        count: withdrawals._count,
        total: Number(withdrawals._sum.amount ?? 0),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
