import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { createConversationSchema } from "@/lib/validation/support";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * The current user's own support conversations, newest first — used by
 * the /contacts chat widget to find an existing OPEN thread to resume
 * before showing the category picker for a new one. Always scoped to
 * `user.id` from the session; a conversationId is never enough to read
 * another user's messages (see [id]/messages/route.ts for the same
 * ownership check on the messages themselves).
 */
export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.supportConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return apiSuccess(conversations);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Starts a new support conversation for the current user in the chosen
 * category. Reuses an existing OPEN conversation instead of creating a
 * second one — the widget only ever shows one active thread at a time
 * (see the model's own doc comment in prisma/schema.prisma), so a user
 * re-opening the drawer, or a double-click on the category picker, never
 * silently forks into two parallel queue entries an admin would have to
 * reconcile.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = createConversationSchema.parse(body);

    const existing = await prisma.supportConversation.findFirst({
      where: { userId: user.id, status: "OPEN" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (existing) return apiSuccess(existing, 200);

    const conversation = await prisma.supportConversation.create({
      data: {
        userId: user.id,
        category: input.category,
      },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return apiSuccess(conversation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
