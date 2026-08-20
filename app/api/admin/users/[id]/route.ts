import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  batchUserFinancialSummaries,
  deriveVerificationStatus,
} from "@/lib/admin/user-summary";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { documents: { orderBy: { uploadedAt: "desc" } }, settings: true },
    });
    if (!user) return apiError("User not found", 404);

    const [spotWallets, orders, transactions, activity, summaries] = await Promise.all([
      prisma.spotWallet.findMany({ where: { userId: id }, orderBy: { currency: "asc" } }),
      prisma.spotOrder.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.transaction.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.auditLog.findMany({
        where: { targetUserId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { admin: { select: { firstName: true, lastName: true, email: true } } },
      }),
      batchUserFinancialSummaries([id]),
    ]);

    const trades = orders.filter((o) => Number(o.filledQuantity) > 0);

    return apiSuccess({
      profile: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        pendingEmail: user.pendingEmail,
        login: user.login,
        role: user.role,
        status: user.status,
        accountType: user.accountType,
        leverageMax: user.leverageMax,
        createdAt: user.createdAt,
      },
      wallet: summaries.get(id) ?? { balance: 0, equity: 0 },
      spotWallets,
      orders,
      trades,
      transactions,
      verification: {
        status: deriveVerificationStatus(user.documents),
        documents: user.documents,
      },
      security: {
        twoFactorOn: user.settings?.twoFactorOn ?? false,
        language: user.settings?.language ?? "en",
        theme: user.settings?.theme ?? "dark",
        notifyEmail: user.settings?.notifyEmail ?? true,
        notifyPush: user.settings?.notifyPush ?? true,
        notifyMarket: user.settings?.notifyMarket ?? false,
      },
      activity,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
