import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, ForbiddenError } from "@/lib/auth/session";
import { sendSupportMessageSchema } from "@/lib/validation/support";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit } from "@/lib/rate-limit";

/** Loads a conversation and verifies it belongs to `userId` — the one
 *  ownership check every route in this file goes through, never trusting
 *  the [id] URL segment alone. Distinguishes "doesn't exist" (404) from
 *  "exists but isn't yours" (403, via ForbiddenError) only in the thrown
 *  error, never in what's returned to the client either way — but the
 *  distinction still matters for handleApiError's status mapping. */
async function loadOwnConversation(id: string, userId: string) {
  const conversation = await prisma.supportConversation.findUnique({ where: { id } });
  if (!conversation) return apiError("Conversation not found", 404);
  if (conversation.userId !== userId) {
    throw new ForbiddenError("This conversation does not belong to you");
  }
  return conversation;
}

/** The current user's own message history for one conversation — polled
 *  by the /contacts chat widget every few seconds while open (see
 *  hooks/use-support-api.ts) rather than a websocket, per this feature's
 *  own "don't build new realtime infra for this" scope. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const conversation = await loadOwnConversation(id, user.id);
    if (conversation instanceof Response) return conversation;

    const messages = await prisma.supportMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, senderType: true, message: true, createdAt: true },
    });

    return apiSuccess({ status: conversation.status, messages });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Sends a message as the conversation's own owner. A message on a CLOSED
 * conversation reopens it to OPEN — the simplest way for a user to bring
 * a resolved-but-not-really thread back into the admin queue without a
 * separate "reopen" control in the widget (see the model's own doc
 * comment on this in prisma/schema.prisma).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Generous — the widget is a live chat, not a form — but still caps a
    // scripted flood of messages into one conversation (or, via ownership
    // being per-user rather than per-conversation, across all of a single
    // user's conversations).
    const limit = rateLimit(`support-message:${user.id}`, 20, 60_000);
    if (!limit.success) {
      return apiError("Too many messages sent. Please slow down.", 429);
    }

    const conversation = await loadOwnConversation(id, user.id);
    if (conversation instanceof Response) return conversation;

    const body = await req.json();
    const input = sendSupportMessageSchema.parse(body);

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: { conversationId: id, senderType: "USER", message: input.message },
        select: { id: true, senderType: true, message: true, createdAt: true },
      });
      await tx.supportConversation.update({
        where: { id },
        data: { status: "OPEN" },
      });
      return created;
    });

    return apiSuccess(message, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
