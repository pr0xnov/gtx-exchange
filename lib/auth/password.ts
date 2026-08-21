import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — avoids look-alike confusion
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#%^&*_-+=";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function pick(set: string): string {
  return set[randomInt(set.length)]!;
}

/** Generates a random password that always satisfies the same strength
 *  rule enforced at registration/change (lib/validation/auth.ts,
 *  lib/validation/settings.ts: 8+ chars, an uppercase letter, a digit) —
 *  used by the admin "Reset Password" action, which never lets an admin
 *  choose the new password themselves. */
export function generateStrongPassword(length = 16): string {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const chars = required.concat(
    Array.from({ length: Math.max(0, length - required.length) }, () => pick(ALL))
  );
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}
