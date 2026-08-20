import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const PAGE_SIZE = 50;

/** A "trade" here means any Spot order with a real fill (partial or
 *  complete) — the same definition Wallet's own Trade History tab uses
 *  (components/wallet/wallet-trade-history.tsx), just across every user
 *  instead of just the current one. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
    const where = { filledQuantity: { gt: 0 } };

    const [total, trades] = await Promise.all([
      prisma.spotOrder.count({ where }),
      prisma.spotOrder.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    return apiSuccess({
      trades,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
