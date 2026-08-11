import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { depositSchema } from "@/lib/validation/trading";
import { apiSuccess, handleApiError } from "@/lib/api-response";

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
    const input = depositSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: input.amount } },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          method: METHOD_LABELS[input.method],
          amount: input.amount,
          status: "COMPLETED",
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Deposit successful",
          message: `Your deposit of ${input.amount} USDT has been credited.`,
        },
      });

      return transaction;
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
