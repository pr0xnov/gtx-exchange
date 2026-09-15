import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import type { SupportConversationStatus } from "@prisma/client";

/**
 * Admin Panel's support queue — every conversation (or, filtered via
 * ?status=OPEN, just the ones still needing attention), newest-activity
 * first. Kept deliberately small (no pagination, no search) per this
 * feature's own "don't build a huge CRM" scope — a real high-volume
 * deployment would need those, but a v1 queue doesn't.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const statusParam = req.nextUrl.searchParams.get("status");
    const status =
      statusParam === "OPEN" || statusParam === "CLOSED"
        ? (statusParam as SupportConversationStatus)
        : undefined;

    const conversations = await prisma.supportConversation.findMany({
      where: status ? { status } : undefined,
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { message: true, senderType: true, createdAt: true },
        },
        _count: { select: { messages: true } },
      },
    });

    return apiSuccess(
      conversations.map((c) => ({
        id: c.id,
        category: c.category,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        user: c.user,
        messageCount: c._count.messages,
        lastMessage: c.messages[0] ?? null,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
