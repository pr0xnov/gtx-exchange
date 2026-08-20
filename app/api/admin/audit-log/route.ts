import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const PAGE_SIZE = 50;

/**
 * Read-only, always — there is no PATCH/DELETE handler in this route file
 * or anywhere else for AuditLog, which is what makes it append-only in
 * practice (see the model's own comment in prisma/schema.prisma).
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const action = searchParams.get("action")?.trim();

    const where = action ? { action } : {};

    const [total, entries] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          admin: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    const targetUserIds = [
      ...new Set(entries.map((e) => e.targetUserId).filter(Boolean)),
    ] as string[];
    const targetUsers = targetUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: targetUserIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const targetUserById = new Map(targetUsers.map((u) => [u.id, u]));

    return apiSuccess({
      entries: entries.map((e) => ({
        id: e.id,
        action: e.action,
        admin: e.admin,
        targetUser: e.targetUserId ? (targetUserById.get(e.targetUserId) ?? null) : null,
        metadata: e.metadata,
        ipAddress: e.ipAddress,
        createdAt: e.createdAt,
      })),
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
