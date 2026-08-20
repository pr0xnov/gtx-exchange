import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    await requireSuperAdmin();

    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        settings: { select: { twoFactorOn: true } },
      },
    });

    return apiSuccess(
      admins.map((a) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        role: a.role,
        status: a.status,
        createdAt: a.createdAt,
        twoFactorOn: a.settings?.twoFactorOn ?? false,
      }))
    );
  } catch (error) {
    return handleApiError(error);
  }
}
