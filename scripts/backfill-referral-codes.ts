/**
 * One-time backfill: assigns a unique, permanent referralCode to every
 * existing User row that doesn't have one yet — part of rolling out the
 * referral program without breaking accounts that predate it (see
 * prisma/migrations/*_add_referral_system_schema, which added the column
 * as nullable specifically so this backfill could run before a second
 * migration makes it NOT NULL).
 *
 * Touches ONLY User.referralCode. Never modifies email, password, wallet
 * balances, verification, orders, or any other trading data.
 *
 * Idempotent — safe to run more than once: only rows where
 * referralCode IS NULL are ever selected/updated.
 *
 * Run via: npx tsx scripts/backfill-referral-codes.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { generateReferralCode } from "../lib/referral/code";

const prisma = new PrismaClient();
const MAX_ATTEMPTS_PER_USER = 5;

async function main() {
  // A raw query, deliberately: User.referralCode is NOT NULL in the
  // current schema (this script already did its one job against the
  // real dev DB), so Prisma's generated types no longer allow filtering
  // on `referralCode: null` at all — this stays a real, safe no-op query
  // rather than code that can't compile against the schema it left
  // behind, in case a future migration ever reopens a nullable window.
  const users = await prisma.$queryRaw<{ id: string; email: string }[]>`
    SELECT id, email FROM "User" WHERE "referralCode" IS NULL
  `;

  console.log(`[backfill-referral-codes] ${users.length} user(s) need a referral code.`);

  let assigned = 0;
  for (const user of users) {
    let done = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_USER && !done; attempt++) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: generateReferralCode() },
        });
        done = true;
        assigned++;
      } catch (err) {
        const isCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("referralCode");
        if (!isCollision) throw err;
      }
    }
    if (!done) {
      throw new Error(
        `[backfill-referral-codes] Could not assign a unique code to ${user.email} after ${MAX_ATTEMPTS_PER_USER} attempts.`
      );
    }
  }

  console.log(`[backfill-referral-codes] Assigned ${assigned} referral code(s).`);
}

main()
  .catch((err) => {
    console.error("[backfill-referral-codes] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
