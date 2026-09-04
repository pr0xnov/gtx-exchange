import { Prisma } from "@prisma/client";
import { ensureSpotWallet } from "@/lib/spot/wallet";

type TxClient = Prisma.TransactionClient;

/** 20% of the original approved deposit amount — currently uncapped,
 *  unlike the (100 USDT capped) referral reward. See lib/referral/rules.ts
 *  for that one. */
export const FIRST_DEPOSIT_BONUS_RATE = new Prisma.Decimal("0.20");

export function computeFirstDepositBonus(depositAmount: Prisma.Decimal): Prisma.Decimal {
  return depositAmount.mul(FIRST_DEPOSIT_BONUS_RATE);
}

/**
 * Called from inside the SAME Prisma transaction that approves a deposit
 * (see PATCH app/api/admin/transactions/[id]/route.ts) — never as a
 * separate, later step. Credits the DEPOSITOR (not a referrer) 20% of
 * their own approved deposit, but only for their FIRST approved deposit,
 * ever — no minimum amount, no cap.
 *
 * Idempotency is enforced at the DATABASE level, the same technique
 * lib/referral/reward.ts uses: FirstDepositBonus.userId is @unique, and
 * creating that row (before any wallet/transaction side effects) is the
 * atomic "claim" on the one bonus a user can ever trigger. A concurrent
 * or later duplicate call (a second approved deposit, an admin double-
 * clicking Approve, a retried request) loses that unique-constraint race
 * and simply returns, having moved no money — the deposit approval
 * itself, which is what actually called this function, is unaffected
 * and still commits normally.
 *
 * A SAVEPOINT (not just a JS try/catch) is required: Postgres marks the
 * WHOLE enclosing transaction aborted the instant any statement inside
 * it fails, including this unique-constraint violation — every later
 * statement in that transaction (the referral-reward attempt right
 * after this, the deposit approval's own notification write) would
 * error too until a ROLLBACK happens. Rolling back to a savepoint undoes
 * only this claim attempt.
 */
export async function tryAwardFirstDepositBonus(
  tx: TxClient,
  deposit: { id: string; userId: string; amount: Prisma.Decimal }
): Promise<void> {
  const bonusAmount = computeFirstDepositBonus(deposit.amount);

  await tx.$executeRaw`SAVEPOINT first_deposit_bonus_claim`;

  let bonus;
  try {
    bonus = await tx.firstDepositBonus.create({
      data: {
        userId: deposit.userId,
        depositTransactionId: deposit.id,
        depositAmount: deposit.amount,
        bonusAmount,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Already claimed by an earlier approved deposit — nothing more to do.
      await tx.$executeRaw`ROLLBACK TO SAVEPOINT first_deposit_bonus_claim`;
      return;
    }
    throw err;
  }
  await tx.$executeRaw`RELEASE SAVEPOINT first_deposit_bonus_claim`;

  await ensureSpotWallet(tx, deposit.userId, "USDT");
  await tx.spotWallet.update({
    where: { userId_currency: { userId: deposit.userId, currency: "USDT" } },
    data: { balance: { increment: bonusAmount } },
  });

  const bonusTransaction = await tx.transaction.create({
    data: {
      userId: deposit.userId,
      type: "FIRST_DEPOSIT_BONUS",
      amount: bonusAmount,
      asset: "USDT",
      status: "COMPLETED",
    },
  });

  await tx.firstDepositBonus.update({
    where: { id: bonus.id },
    data: { bonusTransactionId: bonusTransaction.id },
  });

  await tx.notification.create({
    data: {
      userId: deposit.userId,
      title: "First-deposit bonus credited",
      message: `You received a first-deposit bonus of ${bonusAmount.toString()} USDT.`,
    },
  });
}
