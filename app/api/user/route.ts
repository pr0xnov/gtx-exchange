import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { deriveVerificationStatus } from "@/lib/admin/user-summary";

export async function GET() {
  try {
    const user = await requireUser();
    const documents = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
      select: { status: true, type: true },
    });

    return apiSuccess({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      login: user.login,
      role: user.role,
      accountType: user.accountType,
      leverageMax: user.leverageMax,
      wallet: user.wallet,
      createdAt: user.createdAt,
      verification: deriveVerificationStatus(documents),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
