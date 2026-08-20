import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
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
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

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
