import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { ensureSpotWallet } from "@/lib/spot/wallet";
import { transactionDecisionSchema } from "@/lib/validation/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { getClientIp } from "@/lib/rate-limit";

/** Thrown only when the transaction isn't in a decidable state (already
 *  decided, or not a Deposit/Withdrawal) — caught below and turned into a
 *  clean 400, never leaks as a raw 500. */
class NotDecidableError extends Error {}

/**
 * Approve or reject a PENDING Deposit/Withdrawal request — the admin
 * counterpart to POST /api/deposit and POST /api/withdraw.
 *
 * Deposit: balance was never touched at creation — Approve credits it now,
 * Reject does nothing to the balance.
 *
 * Withdrawal: balance was already debited at creation (see
 * app/api/withdraw/route.ts) — Approve does NOT touch balance again (that
 * would double-debit), Reject refunds the amount back.
 *
 * Double-action protection: `transaction.updateMany({ where: { status:
 * "PENDING" } })` is the single atomic operation that both finds and
 * transitions the row — a transaction that isn't (or is no longer)
 * PENDING updates zero rows, so a second Approve/Reject, or a Reject after
 * an Approve (or vice versa), can never run the balance-mutation branch
 * below a second time, even under concurrent requests (this is the same
 * guarded-update pattern app/api/admin/balance-adjustments/route.ts uses
 * for its DEBIT branch).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const input = transactionDecisionSchema.parse(body);
    const ip = getClientIp(req.headers);

    let transaction;
    try {
      transaction = await prisma.$transaction(async (tx) => {
        const decided = await tx.transaction.updateMany({
          where: { id, status: "PENDING", type: { in: ["DEPOSIT", "WITHDRAWAL"] } },
          data: { status: input.decision === "APPROVE" ? "COMPLETED" : "FAILED" },
        });
        if (decided.count === 0) throw new NotDecidableError();

        const current = await tx.transaction.findUniqueOrThrow({ where: { id } });

        const creditsBalance =
          (current.type === "DEPOSIT" && input.decision === "APPROVE") ||
          (current.type === "WITHDRAWAL" && input.decision === "REJECT");

        if (creditsBalance) {
          await ensureSpotWallet(tx, current.userId, current.asset);
          await tx.spotWallet.update({
            where: {
              userId_currency: { userId: current.userId, currency: current.asset },
            },
            data: { balance: { increment: current.amount } },
          });
        }
        // DEPOSIT + REJECT: balance was never touched — nothing to do.
        // WITHDRAWAL + APPROVE: balance was already debited on creation —
        // nothing to do (touching it again here would double-debit).

        await tx.notification.create({
          data: {
            userId: current.userId,
            title:
              current.type === "DEPOSIT"
                ? input.decision === "APPROVE"
                  ? "Deposit approved"
                  : "Deposit rejected"
                : input.decision === "APPROVE"
                  ? "Withdrawal approved"
                  : "Withdrawal rejected",
            message:
              current.type === "DEPOSIT"
                ? input.decision === "APPROVE"
                  ? `Your deposit of ${current.amount} ${current.asset} has been approved and credited to your balance.`
                  : `Your deposit of ${current.amount} ${current.asset} was rejected.`
                : input.decision === "APPROVE"
                  ? `Your withdrawal of ${current.amount} ${current.asset} has been approved.`
                  : `Your withdrawal of ${current.amount} ${current.asset} was rejected and refunded to your balance.`,
          },
        });

        await createAuditLog(
          {
            adminId: admin.id,
            targetUserId: current.userId,
            action: "TRANSACTION_DECISION",
            metadata: {
              transactionId: current.id,
              type: current.type,
              decision: input.decision,
              amount: current.amount.toString(),
              asset: current.asset,
            },
            ipAddress: ip,
          },
          tx
        );

        return current;
      });
    } catch (error) {
      if (error instanceof NotDecidableError) {
        return apiError("This request is no longer pending", 400);
      }
      throw error;
    }

    return apiSuccess({
      id: transaction.id,
      status: input.decision === "APPROVE" ? "COMPLETED" : "FAILED",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
