import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { TransactionType } from "@prisma/client";

const FILTER_MAP: Record<string, TransactionType[]> = {
  all: ["DEPOSIT", "WITHDRAWAL", "BONUS", "TRADE_SETTLEMENT", "ADMIN_BALANCE_ADJUSTMENT"],
  deposits: ["DEPOSIT"],
  withdrawals: ["WITHDRAWAL"],
  bonuses: ["BONUS"],
  adjustments: ["ADMIN_BALANCE_ADJUSTMENT"],
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const filter = req.nextUrl.searchParams.get("filter") ?? "all";
    const types = FILTER_MAP[filter] ?? FILTER_MAP.all;

    // Explicit select, never a blanket findMany: a DEPOSIT row's
    // `proofData` is the raw payment-confirmation screenshot bytes (see
    // app/api/deposit/route.ts) — must never be bundled into this list
    // response, only ever served through its own protected GET
    // (app/api/deposit/[id]/proof).
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, type: { in: types } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        amount: true,
        asset: true,
        method: true,
        network: true,
        direction: true,
        status: true,
        createdAt: true,
      },
    });

    return apiSuccess(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}
