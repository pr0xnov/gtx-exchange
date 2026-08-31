import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  batchUserFinancialSummaries,
  batchUnreadRequestCounts,
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
      include: {
        // Explicit select, never a blanket include: VerificationDocument
        // now also carries the raw file bytes (fileData) — those must
        // only ever leave the server through the protected
        // GET /api/verification/documents/[id]/file route, never bundled
        // into a general JSON response like this one.
        documents: {
          orderBy: { uploadedAt: "desc" },
          select: {
            id: true,
            type: true,
            fileName: true,
            mimeType: true,
            status: true,
            rejectionReason: true,
            uploadedAt: true,
          },
        },
        settings: true,
      },
    });
    if (!user) return apiError("User not found", 404);

    const [
      spotWallets,
      orders,
      deposits,
      withdrawals,
      activity,
      summaries,
      unreadCounts,
    ] = await Promise.all([
      prisma.spotWallet.findMany({ where: { userId: id }, orderBy: { currency: "asc" } }),
      prisma.spotOrder.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      // Deposits and Withdrawals are fetched separately (each with their
      // own take: 50), not sliced from one combined "50 most recent
      // transactions of any type" query — a shared cap let a genuinely
      // PENDING request quietly age out of view whenever this user also
      // had many other transactions (ADMIN_BALANCE_ADJUSTMENT, BONUS,
      // or the other of Deposit/Withdrawal), which is exactly what made
      // the Withdrawals badge look wrong: the badge (a separate,
      // unbounded, status-only query — see batchUnreadRequestCounts)
      // stayed correct, but the row itself had scrolled out of this
      // table entirely.
      // Explicit select on both, never a blanket findMany: `proofData` is
      // the raw deposit-proof screenshot bytes — like
      // VerificationDocument.fileData, it must only ever leave the server
      // through its own protected GET (app/api/deposit/[id]/proof), never
      // bundled into this general list response. `proofFileName`/
      // `proofMimeType` are enough for the page to know a proof exists
      // and how to open it.
      prisma.transaction.findMany({
        where: { userId: id, type: "DEPOSIT" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          asset: true,
          amount: true,
          method: true,
          network: true,
          direction: true,
          status: true,
          createdAt: true,
          proofFileName: true,
          proofMimeType: true,
        },
      }),
      prisma.transaction.findMany({
        where: { userId: id, type: "WITHDRAWAL" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          asset: true,
          amount: true,
          method: true,
          network: true,
          destinationAddress: true,
          direction: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { targetUserId: id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { admin: { select: { firstName: true, lastName: true, email: true } } },
      }),
      batchUserFinancialSummaries([id]),
      batchUnreadRequestCounts([id]),
    ]);

    const trades = orders.filter((o) => Number(o.filledQuantity) > 0);
    // Kept as one merged field (the page's own Deposits/Withdrawals tabs
    // already just .filter() this by `type`) rather than changing the
    // response shape — each source query above is independently capped by
    // its own type, so a PENDING row from either type survives here
    // regardless of how many transactions of OTHER types this user has.
    const transactions = [...deposits, ...withdrawals];

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
      unread: unreadCounts.get(id) ?? { deposits: 0, withdrawals: 0, verification: 0 },
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
