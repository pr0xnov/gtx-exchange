import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { depositSchema } from "@/lib/validation/trading";
import { apiSuccess, handleApiError } from "@/lib/api-response";

const METHOD_LABELS: Record<string, string> = {
  TETHER_USDT: "Tether (USDT)",
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = depositSchema.parse(body);

    // Deposits no longer credit the balance on creation — an admin must
    // approve the request first (see PATCH /api/admin/transactions/[id]),
    // same admin-decision step Withdrawal already has. Balance (the Spot
    // USDT wallet — see app/api/account/summary/route.ts) is untouched
    // here.
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          method: METHOD_LABELS[input.method],
          amount: input.amount,
          asset: "USDT",
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Deposit request received",
          message: `Your deposit of ${input.amount} USDT is pending approval.`,
        },
      });

      return transaction;
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
