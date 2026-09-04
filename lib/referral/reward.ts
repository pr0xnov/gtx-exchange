import { Prisma } from "@prisma/client";
import { ensureSpotWallet } from "@/lib/spot/wallet";
import { computeReferralReward } from "./rules";

type TxClient = Prisma.TransactionClient;

/**
 * Called from inside the SAME Prisma transaction that approves a deposit
 * (see PATCH app/api/admin/transactions/[id]/route.ts) — never as a
 * separate, later step. Awards the referrer 10% of the referred user's
 * FIRST approved deposit (any amount — no minimum), capped at 100 USDT,
 * once, ever. Calculated ONLY from the original approved deposit amount,
 * never from any bonus (this deposit's own first-deposit bonus, see
 * lib/bonus/first-deposit.ts, is never part of this base).
 *
 * Idempotency is enforced at the DATABASE level, not with an in-memory or
 * JavaScript-only check: ReferralReward.referredUserId is @unique, and
 * creating that row (with no wallet/transaction side effects yet) is the
 * very first write this function performs — it is the atomic "claim" on
 * the one signup reward a referred user can ever trigger. A concurrent or
 * later duplicate call (a second qualifying deposit, an admin double-
 * clicking Approve, a retried request) loses that unique-constraint race
 * and simply returns, having moved no money and left no partial state —
 * the deposit approval itself, which is what actually called this
 * function, is unaffected and still commits normally.
 *
 * Deliberately silent (no return value, no thrown "already rewarded"
 * error) — from the caller's perspective, "the deposit was approved" and
 * "a referral reward may or may not additionally apply" are independent
 * outcomes; the approval must never fail because of this.
 */
export async function tryAwardReferralSignupBonus(
  tx: TxClient,
  deposit: { id: string; userId: string; amount: Prisma.Decimal }
): Promise<void> {
  const referredUser = await tx.user.findUnique({
    where: { id: deposit.userId },
    select: { referredById: true },
  });
  const referrerId = referredUser?.referredById;
  // No inviter, or (structurally shouldn't happen, but never trust it)
  // somehow the referrer and the referred user are the same account.
  if (!referrerId || referrerId === deposit.userId) return;

  const rewardAmount = computeReferralReward(deposit.amount);

  // A SAVEPOINT, not just a JS try/catch: Postgres marks the WHOLE
  // enclosing transaction aborted the instant any statement inside it
  // fails (including this unique-constraint violation) — every later
  // statement in that transaction errors too until a ROLLBACK happens,
  // which would otherwise take down the deposit approval this function
  // was called from. Rolling back to a savepoint undoes only this
  // claim attempt, leaving the rest of the transaction (and the deposit
  // approval itself) free to continue and commit normally.
  await tx.$executeRaw`SAVEPOINT referral_reward_claim`;

  let reward;
  try {
    reward = await tx.referralReward.create({
      data: {
        referrerId,
        referredUserId: deposit.userId,
        depositTransactionId: deposit.id,
        depositAmount: deposit.amount,
        rewardAmount,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Already rewarded for this referred user — nothing more to do.
      await tx.$executeRaw`ROLLBACK TO SAVEPOINT referral_reward_claim`;
      return;
    }
    throw err;
  }
  await tx.$executeRaw`RELEASE SAVEPOINT referral_reward_claim`;

  await ensureSpotWallet(tx, referrerId, "USDT");
  await tx.spotWallet.update({
    where: { userId_currency: { userId: referrerId, currency: "USDT" } },
    data: { balance: { increment: rewardAmount } },
  });

  const rewardTransaction = await tx.transaction.create({
    data: {
      userId: referrerId,
      type: "REFERRAL_BONUS",
      amount: rewardAmount,
      asset: "USDT",
      status: "COMPLETED",
    },
  });

  await tx.referralReward.update({
    where: { id: reward.id },
    data: { rewardTransactionId: rewardTransaction.id },
  });

  await tx.notification.create({
    data: {
      userId: referrerId,
      title: "Referral bonus credited",
      message: `You received a referral bonus of ${rewardAmount.toString()} USDT.`,
    },
  });
}
