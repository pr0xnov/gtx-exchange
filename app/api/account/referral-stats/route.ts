import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * Backs the personal referral-stats section on /bonuses (see
 * components/marketing/bonuses/referral-code-card.tsx). All three numbers
 * are derived straight from existing, already-authoritative data — nothing
 * here is computed client-side or cached separately:
 *
 * - invited: every User this account is the referrer of (User.referredById
 *   === this user's id), regardless of whether they ever deposited.
 * - activated: ReferralReward rows where this user is the referrer — each
 *   row is, by construction (see lib/referral/reward.ts's DB-enforced
 *   idempotency), exactly one referred user whose first approved deposit
 *   qualified for and paid the one-time reward. Every ReferralReward row
 *   that exists was paid (referral rewards have no anti-abuse "claimed but
 *   unpaid" state the way FirstDepositBonus does), so this count is exact.
 * - earned: sum of those same rows' rewardAmount — the total USDT actually
 *   credited to this user via the referral program.
 */
export async function GET() {
  try {
    const user = await requireUser();

    const [invited, rewards] = await Promise.all([
      prisma.user.count({ where: { referredById: user.id } }),
      prisma.referralReward.findMany({
        where: { referrerId: user.id },
        select: { rewardAmount: true },
      }),
    ]);

    const earned = rewards.reduce((sum, r) => sum + Number(r.rewardAmount), 0);

    return apiSuccess({
      invited,
      activated: rewards.length,
      earned,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
