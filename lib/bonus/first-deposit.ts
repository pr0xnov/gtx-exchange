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
 *
 * IP-based anti-abuse (free, no third-party service): before crediting
 * anything, checks whether another account has already been PAID this
 * same bonus from the depositor's own lastKnownIp (see User.lastKnownIp
 * — captured server-side at registration/login, never client-supplied).
 * A match doesn't touch the deposit itself (it's already credited by the
 * caller) and doesn't block the claim row from being created (the
 * idempotency guarantee above must still hold — a user gets at most one
 * FirstDepositBonus row, paid or not) — it just leaves this one
 * unpaid/flagged for manual review instead of auto-crediting. IP is
 * intentionally a soft signal, not an identity check: it's null whenever
 * unverifiable (see lib/security/client-ip.ts), in which case the check
 * is skipped and the bonus pays normally — an absent signal must never
 * itself deny a legitimate user their bonus.
 *
 * "First deposit" means the user's actual earliest-ever APPROVED/
 * COMPLETED deposit, full stop — never "the first deposit since this
 * FirstDepositBonus.userId unique constraint existed for them", which is
 * all the code used to check (a real bug: an account with older completed
 * deposits from before this feature shipped would still pass that check
 * on its next deposit, since it had never claimed a FirstDepositBonus row
 * yet, and get paid on a deposit that was never actually its first). The
 * fix re-derives "is this really the earliest completed deposit" from
 * Transaction history on every call rather than trusting the absence of a
 * FirstDepositBonus row as proof. This needs no extra "disqualified"
 * flag/migration: a user's true earliest COMPLETED deposit's id never
 * changes once it exists, so every later deposit's id will permanently
 * fail to match it — the same re-derivation that disqualifies a
 * pre-existing user on their very next deposit keeps disqualifying them
 * on every deposit after that, forever, for free.
 */
export async function tryAwardFirstDepositBonus(
  tx: TxClient,
  deposit: { id: string; userId: string; amount: Prisma.Decimal }
): Promise<void> {
  const earliestCompletedDeposit = await tx.transaction.findFirst({
    where: { userId: deposit.userId, type: "DEPOSIT", status: "COMPLETED" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (earliestCompletedDeposit?.id !== deposit.id) {
    // A COMPLETED deposit already existed before this one — this is not
    // actually the user's first deposit, regardless of whether they've
    // ever claimed this bonus before. Never pay, never retroactively
    // reinterpret a later deposit as "the first" (see this function's own
    // doc comment above).
    return;
  }

  const bonusAmount = computeFirstDepositBonus(deposit.amount);

  const depositor = await tx.user.findUniqueOrThrow({
    where: { id: deposit.userId },
    select: { lastKnownIp: true, lastKnownDeviceHash: true },
  });

  await tx.$executeRaw`SAVEPOINT first_deposit_bonus_claim`;

  let bonus;
  try {
    bonus = await tx.firstDepositBonus.create({
      data: {
        userId: deposit.userId,
        depositTransactionId: deposit.id,
        depositAmount: deposit.amount,
        bonusAmount,
        claimIp: depositor.lastKnownIp,
        claimDeviceHash: depositor.lastKnownDeviceHash,
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

  if (depositor.lastKnownIp) {
    const priorPayoutFromSameIp = await tx.firstDepositBonus.findFirst({
      where: {
        claimIp: depositor.lastKnownIp,
        userId: { not: deposit.userId },
        bonusTransactionId: { not: null },
      },
      select: { id: true },
    });
    if (priorPayoutFromSameIp) {
      // Claim row stays (idempotency is preserved — this user can never
      // trigger a second attempt), but bonusTransactionId is never set,
      // so nothing is credited. Not exposed to the user; an admin can
      // find these via FirstDepositBonus.reviewReason.
      await tx.firstDepositBonus.update({
        where: { id: bonus.id },
        data: { reviewReason: "DUPLICATE_IP" },
      });
      return;
    }
  }

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
