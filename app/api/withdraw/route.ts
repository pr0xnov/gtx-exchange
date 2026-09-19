import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { withdrawSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { isUserVerified } from "@/lib/verification/status";
import { ensureSpotWallet } from "@/lib/spot/wallet";
import { rateLimit } from "@/lib/rate-limit";

const METHOD_LABELS: Record<string, string> = {
  TETHER_USDT: "Tether (USDT)",
};

const QUOTE_CURRENCY = "USDT";

/** Thrown only to trigger Prisma's automatic transaction rollback on a
 *  withdrawal that would overdraw the wallet — caught below and turned
 *  into a clean 400, never leaks as a raw 500. */
class InsufficientBalanceError extends Error {}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    // Keyed by user (not IP): a withdrawal always requires an authenticated,
    // verified account, so the meaningful abuse unit is "one account
    // submitting many withdrawals," not the network address it's behind.
    const limit = rateLimit(`withdraw:${user.id}`, 5, 60_000);
    if (!limit.success) {
      return apiError("Too many withdrawal requests. Please try again shortly.", 429);
    }

    if (!(await isUserVerified(user.id))) {
      return apiError("Please complete verification before withdrawing funds", 403);
    }

    const body = await req.json();
    const input = withdrawSchema.parse(body);

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        await ensureSpotWallet(tx, user.id, QUOTE_CURRENCY);

        // Debited immediately, atomically — the balance the user actually
        // sees (Spot USDT wallet, see app/api/account/summary/route.ts),
        // never the separate futures margin Wallet. Same guarded
        // check-and-debit pattern as the admin balance-adjustment DEBIT
        // branch (app/api/admin/balance-adjustments/route.ts): the `gte`
        // condition on the WHERE clause is what makes this safe under
        // concurrent requests, not a separate read-then-write.
        const debited = await tx.spotWallet.updateMany({
          where: {
            userId: user.id,
            currency: QUOTE_CURRENCY,
            balance: { gte: input.amount },
          },
          data: { balance: { decrement: input.amount } },
        });
        if (debited.count === 0) throw new InsufficientBalanceError();

        const transaction = await tx.transaction.create({
          data: {
            userId: user.id,
            type: "WITHDRAWAL",
            method: METHOD_LABELS[input.method],
            network: input.network,
            destinationAddress: input.destinationAddress,
            amount: input.amount,
            asset: QUOTE_CURRENCY,
            status: "PENDING",
          },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            title: "Withdrawal requested",
            message: `Your withdrawal of ${input.amount} USDT has been deducted from your balance and is pending approval.`,
          },
        });

        return transaction;
      });
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return apiError("Insufficient balance for this withdrawal", 400);
      }
      throw error;
    }

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
