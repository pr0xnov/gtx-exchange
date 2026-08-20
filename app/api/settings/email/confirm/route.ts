import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { emailChangedNoticeEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";
import { env } from "@/lib/env";

/**
 * Clicked from the confirmation email, not called by the SPA — no session
 * cookie is expected (the browser opening the link may not even be logged
 * into GTX), so the raw token itself is the only credential here, exactly
 * like a password-reset link. Redirects back into the app rather than
 * returning JSON, since a person, not client-side JS, is the caller.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const redirectTo = (status: "confirmed" | "invalid" | "expired") =>
    NextResponse.redirect(new URL(`/settings?emailChange=${status}`, env.APP_URL));

  if (!token) return redirectTo("invalid");

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await prisma.user.findUnique({
    where: { emailChangeTokenHash: tokenHash },
  });

  if (!user || !user.pendingEmail || !user.emailChangeExpiresAt) {
    return redirectTo("invalid");
  }
  if (user.emailChangeExpiresAt < new Date()) {
    return redirectTo("expired");
  }

  const oldEmail = user.email;
  const newEmail = user.pendingEmail;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: newEmail,
      pendingEmail: null,
      emailChangeTokenHash: null,
      emailChangeExpiresAt: null,
    },
  });

  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  if (!settings || settings.notifyEmail) {
    const locale = resolveUserLocale(settings?.language);
    // To the address being replaced, not the new one — the point is
    // alerting whoever still has that old inbox open.
    void sendMail(emailChangedNoticeEmail(locale, oldEmail, newEmail));
  }

  return redirectTo("confirmed");
}
