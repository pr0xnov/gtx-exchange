import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email/mailer";
import { passwordResetRequestEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Deliberately always returns the same success response whether or not
 * the email belongs to a real account — this is the one place in the app
 * where confirming/denying an email's existence would itself be a
 * security leak (account enumeration). Same token-hashing approach as
 * the email-change flow (see app/api/settings/email/request/route.ts):
 * only a SHA-256 hash is ever persisted, the raw token exists only in the
 * outgoing email and this request's own memory.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`forgot-password:${ip}`, 5, 60_000);
    if (!limit.success) {
      return apiSuccess({ requested: true });
    }

    const body = await req.json();
    const input = forgotPasswordSchema.parse(body);

    // Never logs the raw token or password — only enough to see exactly
    // which step a failed reset attempt died at (see the "email doesn't
    // arrive" investigation this was added for).
    // eslint-disable-next-line no-console
    console.log("[forgot-password] Password reset requested");
    // eslint-disable-next-line no-console
    console.log(`[forgot-password] Email: ${input.email}`);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // eslint-disable-next-line no-console
    console.log(`[forgot-password] User found: ${Boolean(user)}`);

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });
      // eslint-disable-next-line no-console
      console.log("[forgot-password] Reset token created: true");

      const settings = await prisma.userSettings.findUnique({
        where: { userId: user.id },
      });
      const locale = resolveUserLocale(settings?.language);
      const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
      // Never log the URL itself — it carries the raw reset token, which
      // is exactly what's needed to take over the account until it
      // expires. Anyone who can read logs (ops tooling, a misconfigured
      // aggregator, a compromised log pipeline) would otherwise be able to
      // hijack any pending reset without ever touching the user's inbox.
      // eslint-disable-next-line no-console
      console.log("[forgot-password] Reset URL generated");

      // eslint-disable-next-line no-console
      console.log("[forgot-password] Email sending started");
      const sent = await sendMail(
        passwordResetRequestEmail(locale, user.email, resetUrl)
      );
      // eslint-disable-next-line no-console
      console.log(`[forgot-password] Email sending ${sent ? "completed" : "failed"}`);
    }

    // Same response, same shape, whether or not `user` was found above —
    // the only observable difference an outside caller ever gets is
    // "an email may or may not have been sent", never a yes/no on the
    // account's existence.
    return apiSuccess({ requested: true });
  } catch (error) {
    return handleApiError(error);
  }
}
