import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { deriveVerificationStatus } from "@/lib/admin/user-summary";

export async function GET() {
  try {
    const user = await requireUser();
    const [documents, settings] = await Promise.all([
      prisma.verificationDocument.findMany({
        where: { userId: user.id },
        select: { status: true, type: true },
      }),
      prisma.userSettings.findUnique({
        where: { userId: user.id },
        select: { twoFactorOn: true },
      }),
    ]);

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
      twoFactorOn: settings?.twoFactorOn ?? false,
      referralCode: user.referralCode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
