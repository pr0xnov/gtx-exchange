import { Prisma } from "@prisma/client";

/**
 * The referral signup-reward business rule (see lib/referral/reward.ts for
 * where this is applied): a referred user's FIRST approved deposit pays
 * their referrer 10% of it, capped at 100 USDT, once, ever — no minimum
 * deposit amount (superseding the earlier 250-1000 USDT qualifying
 * window: a 1,500/5,000/10,000 USDT deposit now pays the 100 USDT cap
 * rather than 0). Decimal-safe throughout — never plain JS floating
 * point for money.
 */
export const REFERRAL_REWARD_RATE = new Prisma.Decimal("0.10");
export const REFERRAL_REWARD_MAX = new Prisma.Decimal(100);

export function computeReferralReward(depositAmount: Prisma.Decimal): Prisma.Decimal {
  const raw = depositAmount.mul(REFERRAL_REWARD_RATE);
  return raw.gt(REFERRAL_REWARD_MAX) ? REFERRAL_REWARD_MAX : raw;
}
