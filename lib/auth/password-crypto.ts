import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/lib/env";

/**
 * At-rest, REVERSIBLE encryption for a user's current password — entirely
 * separate from `passwordHash` (bcrypt, one-way, the only thing login ever
 * checks — see lib/auth/password.ts) and from lib/auth/crypto.ts's
 * TOTP-secret encryption (keyed off JWT_ACCESS_SECRET). This one exists
 * solely so SUPER_ADMIN can view a user's current password through
 * GET /api/admin/users/[id]/password; nothing else in the app ever reads
 * it, and it is never used to authenticate anyone.
 *
 * Deliberately keyed by its own dedicated PASSWORD_ENCRYPTION_KEY (never
 * reused from any other secret) so this one capability can be reconfigured
 * or revoked independently — and deliberately has NO default/fallback
 * value: a server that hasn't set it should fail this one feature loudly,
 * not silently encrypt with a guessable key.
 */
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended GCM nonce size

function getKey(): Buffer {
  const raw = env.PASSWORD_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "PASSWORD_ENCRYPTION_KEY is not configured on this server — password encryption/viewing is unavailable."
    );
  }
  return createHash("sha256").update(raw).digest();
}

/** Whether the feature can be used at all right now — lets callers that
 *  write a password (register, change, reset) degrade gracefully to
 *  leaving `encryptedPassword` null instead of failing the whole request
 *  when the key isn't configured (a null value is an expected, handled
 *  state — see the "Not available" case in the Password column). */
export function isPasswordEncryptionConfigured(): boolean {
  return Boolean(env.PASSWORD_ENCRYPTION_KEY);
}

/** Returns `${ivHex}:${authTagHex}:${ciphertextHex}` — self-contained, no separate storage needed for the IV/tag. */
export function encryptPassword(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptPassword(encoded: string): string {
  const key = getKey();
  const [ivHex, authTagHex, ciphertextHex] = encoded.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted password");
  }
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}

/** Best-effort encrypt for write paths (register/change/reset password):
 *  returns null instead of throwing when the key isn't configured, so a
 *  missing PASSWORD_ENCRYPTION_KEY degrades the "SUPER_ADMIN can view this
 *  password" feature only, never blocks login/registration/password
 *  changes themselves. */
export function maybeEncryptPassword(plain: string): string | null {
  return isPasswordEncryptionConfigured() ? encryptPassword(plain) : null;
}
