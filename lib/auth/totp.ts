import * as OTPAuth from "otpauth";

const ISSUER = "GTX";

/** A fresh base32 TOTP secret for a new 2FA setup attempt — not yet persisted. */
export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** otpauth:// URI for the authenticator app to scan (as a QR code) during setup. */
export function buildTotpUri(secret: string, accountLabel: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountLabel,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

/**
 * Verifies a 6-digit code against a secret, tolerating one 30s step of
 * clock drift on either side (Google Authenticator/Authy do the same).
 * Returns true/false — never throws on a malformed code.
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}
