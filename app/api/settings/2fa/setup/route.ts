import QRCode from "qrcode";
import { requireUser } from "@/lib/auth/session";
import { generateTotpSecret, buildTotpUri } from "@/lib/auth/totp";
import { signTwoFaSetupToken } from "@/lib/auth/jwt";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/**
 * Generates a fresh TOTP secret and returns it as a QR code + the
 * setupToken that carries it (signed, 10-minute TTL — see lib/auth/jwt.ts)
 * for the client to echo back to /2fa/enable with a verification code.
 * Nothing is written to the database here: the secret only reaches
 * UserSettings once /2fa/enable proves the user actually scanned it and
 * their authenticator produces matching codes.
 */
export async function POST() {
  try {
    const user = await requireUser();

    const secret = generateTotpSecret();
    const uri = buildTotpUri(secret, user.email);
    const qrCodeDataUrl = await QRCode.toDataURL(uri);
    const setupToken = signTwoFaSetupToken({ sub: user.id, secret });

    return apiSuccess({ qrCodeDataUrl, secret, setupToken });
  } catch (error) {
    return handleApiError(error);
  }
}
