import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { ensureSpotWallet } from "@/lib/spot/wallet";
import { balanceAdjustmentSchema } from "@/lib/validation/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit/log";
import { sendMail } from "@/lib/email/mailer";
import { balanceAdjustedEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";

/** Thrown only to trigger Prisma's automatic transaction rollback on a
 *  DEBIT that would overdraw the wallet — caught below and turned into a
 *  clean 400, never leaks as a raw 500. */
class InsufficientBalanceError extends Error {}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const userId = req.nextUrl.searchParams.get("userId");

    const adjustments = await prisma.balanceAdjustment.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        admin: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return apiSuccess(adjustments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const ip = getClientIp(req.headers);
    const limit = rateLimit(`admin-balance-adjustment:${admin.id}`, 20, 60_000);
    if (!limit.success) {
      return apiError("Too many adjustments. Please slow down.", 429);
    }

    const body = await req.json();
    const input = balanceAdjustmentSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { settings: true },
    });
    if (!targetUser) return apiError("User not found", 404);

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        await ensureSpotWallet(tx, input.userId, input.asset);

        if (input.direction === "CREDIT") {
          await tx.spotWallet.update({
            where: { userId_currency: { userId: input.userId, currency: input.asset } },
            data: { balance: { increment: input.amount } },
          });
        } else {
          // Same atomic check-and-debit pattern Spot order placement uses
          // (app/api/spot/orders/route.ts) — only ever touches `balance`,
          // never `locked` (funds a user's own open orders have already
          // reserved are not the admin's to reach into), and can never
          // drive the wallet negative even under concurrent requests.
          const debited = await tx.spotWallet.updateMany({
            where: {
              userId: input.userId,
              currency: input.asset,
              balance: { gte: input.amount },
            },
            data: { balance: { decrement: input.amount } },
          });
          if (debited.count === 0) throw new InsufficientBalanceError();
        }

        const transaction = await tx.transaction.create({
          data: {
            userId: input.userId,
            type: "ADMIN_BALANCE_ADJUSTMENT",
            amount: input.amount,
            asset: input.asset,
            direction: input.direction,
            status: "COMPLETED",
          },
        });

        const adjustment = await tx.balanceAdjustment.create({
          data: {
            userId: input.userId,
            adminId: admin.id,
            asset: input.asset,
            direction: input.direction,
            amount: input.amount,
            reason: input.reason,
            transactionId: transaction.id,
          },
        });

        await tx.notification.create({
          data: {
            userId: input.userId,
            title: input.direction === "CREDIT" ? "Balance credited" : "Balance adjusted",
            message:
              input.direction === "CREDIT"
                ? `Your ${input.asset} balance was credited by ${input.amount}.`
                : `Your ${input.asset} balance was debited by ${input.amount}.`,
          },
        });

        await createAuditLog(
          {
            adminId: admin.id,
            targetUserId: input.userId,
            action: "ADMIN_BALANCE_ADJUSTMENT",
            metadata: {
              asset: input.asset,
              amount: input.amount,
              direction: input.direction,
              reason: input.reason,
              transactionId: transaction.id,
              adjustmentId: adjustment.id,
            },
            ipAddress: ip,
          },
          tx
        );

        return { transaction, adjustment };
      });
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return apiError("User's balance is lower than the amount to remove", 400);
      }
      throw error;
    }

    // Never blocks the (already-committed) adjustment on delivery — same
    // pattern as the password-changed notice in
    // app/api/settings/password/route.ts. Deliberately omits the admin's
    // identity/reason from what the user is told; that detail stays
    // internal to the Audit Log.
    if (!targetUser.settings || targetUser.settings.notifyEmail) {
      const locale = resolveUserLocale(targetUser.settings?.language);
      void sendMail(
        balanceAdjustedEmail(locale, targetUser.email, {
          asset: input.asset,
          amount: input.amount,
          direction: input.direction,
        })
      );
    }

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
