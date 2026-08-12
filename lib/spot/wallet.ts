import type { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Ensures a SpotWallet row exists for (userId, currency) — idempotent, and
 * safe to call unconditionally before the atomic balance updates below.
 * Registration seeds all SPOT_CURRENCIES up front (see
 * app/api/auth/register/route.ts and prisma/seed.ts), but this keeps
 * order placement self-healing for any account that predates that, rather
 * than the balance check spuriously failing because the row is missing.
 */
export async function ensureSpotWallet(
  tx: TxClient,
  userId: string,
  currency: string
): Promise<void> {
  await tx.spotWallet.upsert({
    where: { userId_currency: { userId, currency } },
    update: {},
    create: { userId, currency },
  });
}
