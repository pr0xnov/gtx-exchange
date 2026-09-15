import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { closeConversationSchema } from "@/lib/validation/support";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

/** One conversation's full message history, for the Admin Panel's
 *  detail/reply view. Unlike the user-facing GET (app/api/support/
 *  conversations/[id]/messages), there's no ownership check here beyond
 *  requireAdmin() — any admin can open any user's conversation, the same
 *  authorization model every other /admin/** review screen (Verification,
 *  Transactions, ...) already uses. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const conversation = await prisma.supportConversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, senderType: true, message: true, createdAt: true },
        },
      },
    });
    if (!conversation) return apiError("Conversation not found", 404);

    return apiSuccess(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Closes (or reopens) a conversation — the only state an admin changes
 *  directly; replying is a separate endpoint (./messages). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const input = closeConversationSchema.parse(body);

    const updated = await prisma.supportConversation.updateMany({
      where: { id },
      data: { status: input.status },
    });
    if (updated.count === 0) return apiError("Conversation not found", 404);

    return apiSuccess({ id, status: input.status });
  } catch (error) {
    return handleApiError(error);
  }
}
