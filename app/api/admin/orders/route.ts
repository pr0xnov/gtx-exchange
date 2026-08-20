import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const PAGE_SIZE = 50;
const ORDER_STATUSES = [
  "OPEN",
  "FILLED",
  "CANCELLED",
] satisfies Prisma.SpotOrderWhereInput["status"][];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
    const statusParam = req.nextUrl.searchParams.get("status");
    const status = ORDER_STATUSES.find((s) => s === statusParam);
    const where: Prisma.SpotOrderWhereInput = status ? { status } : {};

    const [total, orders] = await Promise.all([
      prisma.spotOrder.count({ where }),
      prisma.spotOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);

    return apiSuccess({
      orders,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
