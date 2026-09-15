import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { sendSupportMessageSchema } from "@/lib/validation/support";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

/**
 * An admin's reply to a user's support conversation. Written with
 * senderType "ADMIN" and no senderId — shown to the user as "GTX
 * Support", never a named employee (see SupportMessage's own doc comment
 * in prisma/schema.prisma). Doesn't reopen a CLOSED conversation on its
 * own (unlike the user-facing POST, which does) — an admin closing a
 * thread and then replying to it is unusual enough that requiring an
 * explicit PATCH to reopen first is the safer default.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const exists = await prisma.supportConversation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) return apiError("Conversation not found", 404);

    const body = await req.json();
    const input = sendSupportMessageSchema.parse(body);

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: { conversationId: id, senderType: "ADMIN", message: input.message },
        select: { id: true, senderType: true, message: true, createdAt: true },
      });
      // Bumps updatedAt so a replied-to conversation sorts by recent
      // activity in both the admin queue and the user's own list, the
      // same way the user's own POST does.
      await tx.supportConversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
      return created;
    });

    return apiSuccess(message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
