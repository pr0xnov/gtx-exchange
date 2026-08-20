import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/lib/env";

/**
 * At-rest encryption for small secrets we must be able to read back
 * (unlike passwords, which only ever need one-way hashing) — currently
 * just the TOTP secret in UserSettings.twoFactorSecret. Deriving the
 * AES key from the existing JWT_ACCESS_SECRET (via SHA-256, to get a
 * fixed 32-byte key regardless of that env var's own length) avoids
 * introducing a second secret to provision/rotate; it's already
 * server-only, high-entropy material never exposed to clients.
 */
const KEY = createHash("sha256").update(env.JWT_ACCESS_SECRET).digest();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended GCM nonce size

/** Returns `${ivHex}:${authTagHex}:${ciphertextHex}` — self-contained, no separate storage needed for the IV/tag. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptSecret(encoded: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encoded.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted secret");
  }
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}
