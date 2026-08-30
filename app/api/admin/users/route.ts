import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import {
  batchUserFinancialSummaries,
  batchUnreadRequestCounts,
  deriveVerificationStatus,
} from "@/lib/admin/user-summary";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { login: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        // Explicit select, never a blanket include: VerificationDocument
        // also carries the raw file bytes (fileData) — those must only
        // ever leave the server through the protected GET
        // /api/verification/documents/[id]/file route, never bundled into
        // a general list response like this one. Only status/type are
        // actually needed here (for deriveVerificationStatus).
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          documents: { select: { status: true, type: true } },
        },
      }),
    ]);

    const userIds = users.map((u) => u.id);
    const [summaries, unreadCounts] = await Promise.all([
      batchUserFinancialSummaries(userIds),
      batchUnreadRequestCounts(userIds),
    ]);

    const rows = users.map((u) => {
      const unread = unreadCounts.get(u.id) ?? {
        deposits: 0,
        withdrawals: 0,
        verification: 0,
      };
      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        status: u.status,
        verification: deriveVerificationStatus(u.documents),
        createdAt: u.createdAt,
        balance: summaries.get(u.id)?.balance ?? 0,
        equity: summaries.get(u.id)?.equity ?? 0,
        unreadCount: unread.deposits + unread.withdrawals + unread.verification,
      };
    });

    return apiSuccess({
      users: rows,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
