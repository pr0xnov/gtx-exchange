import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return apiError("Order not found", 404);
    }
    if (order.status !== "PENDING") {
      return apiError("Only pending orders can be cancelled", 400);
    }

    const cancelled = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return apiSuccess(cancelled);
  } catch (error) {
    return handleApiError(error);
  }
}
