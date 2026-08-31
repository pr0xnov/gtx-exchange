import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const PAGE_SIZE = 50;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
    const where = { type: "DEPOSIT" as const };

    const [total, deposits] = await Promise.all([
      prisma.transaction.count({ where }),
      // Explicit select, never a blanket findMany: `proofData` is the raw
      // deposit-proof screenshot bytes (see app/api/deposit/route.ts) —
      // must never be bundled into this list response, only ever served
      // through its own protected GET (app/api/deposit/[id]/proof).
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          amount: true,
          asset: true,
          method: true,
          network: true,
          status: true,
          createdAt: true,
          proofFileName: true,
          proofMimeType: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return apiSuccess({
      deposits,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
