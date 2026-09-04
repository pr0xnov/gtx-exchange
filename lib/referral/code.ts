import { randomBytes } from "crypto";

// Uppercase letters + digits, minus the visually-confusable O/0 and I/1.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const PREFIX = "GTX";

/**
 * A single candidate code, e.g. "GTX8K4P2Q" — cryptographically random
 * (not sequential/predictable), never checked for uniqueness here.
 * Callers own the retry-on-collision loop against the DB's unique
 * constraint on User.referralCode (see app/api/auth/register/route.ts and
 * scripts/backfill-referral-codes.ts, the two places a User row is
 * created/updated with one).
 */
export function generateReferralCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `${PREFIX}${suffix}`;
}

/** Referral codes are case-insensitive — this is the one normalization
 *  both generation-time storage and user-entered lookup must agree on. */
export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}
