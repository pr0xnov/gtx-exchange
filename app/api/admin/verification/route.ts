import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/** Every PENDING document across all users — the admin's work queue. */
export async function GET() {
  try {
    await requireAdmin();

    const documents = await prisma.verificationDocument.findMany({
      where: { status: "PENDING" },
      orderBy: { uploadedAt: "asc" },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    return apiSuccess(documents);
  } catch (error) {
    return handleApiError(error);
  }
}
