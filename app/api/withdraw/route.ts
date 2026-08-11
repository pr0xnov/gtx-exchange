import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { withdrawSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const METHOD_LABELS: Record<string, string> = {
  VISA_MASTERCARD: "Visa / Mastercard",
  BANK_TRANSFER: "Bank Transfer",
  BITCOIN: "Bitcoin",
  TETHER_USDT: "Tether (USDT)",
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = withdrawSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Atomically check-and-debit: the balance check and the decrement
      // are the same conditional UPDATE, not a stale pre-transaction
      // read followed by a separate write. Two concurrent withdrawals can
      // therefore never both pass the check against the same balance and
      // drive it negative — the second one simply matches zero rows here.
      const debited = await tx.wallet.updateMany({
        where: { userId: user.id, balance: { gte: input.amount } },
        data: { balance: { decrement: input.amount } },
      });

      if (debited.count === 0) {
        return null;
      }

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          method: METHOD_LABELS[input.method],
          amount: input.amount,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Withdrawal requested",
          message: `Your withdrawal of ${input.amount} USDT is being processed.`,
        },
      });

      return transaction;
    });

    if (!result) {
      return apiError("Insufficient balance for this withdrawal", 400);
    }

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
