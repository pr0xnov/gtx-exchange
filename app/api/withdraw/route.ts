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

    const wallet = user.wallet;
    if (!wallet || Number(wallet.balance) < input.amount) {
      return apiError("Insufficient balance for this withdrawal", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: input.amount } },
      });

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

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
