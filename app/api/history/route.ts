import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { TransactionType } from "@prisma/client";

const FILTER_MAP: Record<string, TransactionType[]> = {
  all: ["DEPOSIT", "WITHDRAWAL", "BONUS", "TRADE_SETTLEMENT"],
  deposits: ["DEPOSIT"],
  withdrawals: ["WITHDRAWAL"],
  bonuses: ["BONUS"],
};

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const filter = req.nextUrl.searchParams.get("filter") ?? "all";
    const types = FILTER_MAP[filter] ?? FILTER_MAP.all;

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, type: { in: types } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return apiSuccess(transactions);
  } catch (error) {
    return handleApiError(error);
  }
}
