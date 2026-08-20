import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { requestEmailChangeSchema } from "@/lib/validation/settings";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email/mailer";
import { emailChangeConfirmEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = getClientIp(req.headers);
    const limit = rateLimit(`email-change:${user.id}:${ip}`, 5, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = requestEmailChangeSchema.parse(body);

    const validPassword = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!validPassword) {
      return apiError("Current password is incorrect", 401);
    }

    if (input.newEmail === user.email) {
      return apiError("This is already your current email", 422);
    }

    const existing = await prisma.user.findUnique({ where: { email: input.newEmail } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    // Store only a hash of the token (same reasoning as a password): a DB
    // read (backup, replica lag, injection bug) can't be turned into a
    // usable confirmation link. The raw token only ever exists in the
    // email itself and this one response body's implicit link target.
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: input.newEmail,
        emailChangeTokenHash: tokenHash,
        emailChangeExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    const locale = resolveUserLocale(settings?.language);
    const confirmUrl = `${env.APP_URL}/api/settings/email/confirm?token=${rawToken}`;
    void sendMail(emailChangeConfirmEmail(locale, input.newEmail, confirmUrl));

    return apiSuccess({ pendingEmail: input.newEmail });
  } catch (error) {
    return handleApiError(error);
  }
}
