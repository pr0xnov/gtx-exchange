import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { maybeEncryptPassword } from "@/lib/auth/password-crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email/mailer";
import { passwordChangedEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";

/**
 * Redeems a forgot-password token: verifies it (hash match + not
 * expired), sets a new passwordHash (and, same as every other
 * password-setting path in this app, a fresh encryptedPassword — see
 * lib/auth/password-crypto.ts), then immediately clears the token fields
 * so it can never be used a second time, before or after expiry.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`reset-password:${ip}`, 10, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = resetPasswordSchema.parse(body);

    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const user = await prisma.user.findUnique({
      where: { passwordResetTokenHash: tokenHash },
    });

    if (!user || !user.passwordResetExpiresAt) {
      return apiError("This reset link is invalid or has already been used", 400);
    }
    if (user.passwordResetExpiresAt < new Date()) {
      return apiError("This reset link has expired. Please request a new one.", 400);
    }

    const passwordHash = await hashPassword(input.newPassword);
    const encryptedPassword = maybeEncryptPassword(input.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        encryptedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    if (!settings || settings.notifyEmail) {
      const locale = resolveUserLocale(settings?.language);
      void sendMail(passwordChangedEmail(locale, user.email));
    }

    return apiSuccess({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
