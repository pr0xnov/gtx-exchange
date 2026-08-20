import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const PAGE_SIZE = 50;
const TRANSACTION_TYPES = [
  "DEPOSIT",
  "WITHDRAWAL",
  "BONUS",
  "TRADE_SETTLEMENT",
  "ADMIN_BALANCE_ADJUSTMENT",
] satisfies Prisma.TransactionWhereInput["type"][];

/** Every Transaction row, any type — Deposits/Withdrawals below are this
 *  same query pre-filtered to one type each. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
    const typeParam = req.nextUrl.searchParams.get("type");
    const type = TRANSACTION_TYPES.find((t) => t === typeParam);

    const where: Prisma.TransactionWhereInput = type ? { type } : {};

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    return apiSuccess({
      transactions,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
