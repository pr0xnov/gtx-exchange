import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { maybeEncryptPassword } from "@/lib/auth/password-crypto";
import { changePasswordSchema } from "@/lib/validation/settings";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email/mailer";
import { passwordChangedEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    // Guards brute-forcing the current-password field specifically —
    // login already has its own IP-based limit, this is a second
    // independent one scoped to this authenticated user.
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`change-password:${user.id}:${ip}`, 5, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = changePasswordSchema.parse(body);

    const validCurrent = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!validCurrent) {
      return apiError("Current password is incorrect", 401);
    }

    const passwordHash = await hashPassword(input.newPassword);
    const encryptedPassword = maybeEncryptPassword(input.newPassword);

    // Revoke every refresh token this user currently has (any device,
    // any tab) in the same transaction as the hash update — atomic, so a
    // failure on either side leaves neither applied: never a changed
    // password with old sessions still trusted, never revoked sessions
    // with the old password still active. The still-live access token
    // (15m) keeps working until its own natural expiry either way (it
    // carries no password-derived claim — see lib/auth/jwt.ts), but once
    // it expires, POST /api/auth/refresh's existing `stored.revoked`
    // check (app/api/auth/refresh/route.ts) already rejects every one of
    // these tokens — no change needed there. Deliberately "revoke all",
    // including the very session making this request, rather than
    // carving out an exception for it: simpler and safer for a
    // security-sensitive change like this one.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, encryptedPassword },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revoked: false },
        data: { revoked: true },
      }),
    ]);

    // A failed send must never undo (or even fail the response for) an
    // already-committed password change — the hash above is already
    // saved by the time this runs.
    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    if (!settings || settings.notifyEmail) {
      const locale = resolveUserLocale(settings?.language);
      void sendMail(passwordChangedEmail(locale, user.email));
    }

    return apiSuccess({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
