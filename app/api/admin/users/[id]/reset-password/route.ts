import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { generateStrongPassword, hashPassword } from "@/lib/auth/password";
import { maybeEncryptPassword } from "@/lib/auth/password-crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/email/mailer";
import { passwordChangedEmail } from "@/lib/email/templates";
import { resolveUserLocale } from "@/lib/i18n/config";

/**
 * Admin-initiated password reset — available to any ADMIN/SUPER_ADMIN
 * (requireAdmin), for the users who can't be shown their current password
 * (everyone except when viewed by SUPER_ADMIN). Generates a brand-new
 * random password, replaces both passwordHash (auth) and encryptedPassword
 * (the SUPER_ADMIN "Show" copy) together, and returns the new plaintext
 * exactly once in this response — it is never persisted anywhere in
 * plaintext, logged, or retrievable again afterward (SUPER_ADMIN would see
 * it again only via the normal Show flow, reading the fresh
 * encryptedPassword this same request just wrote).
 *
 * A plain ADMIN resetting another admin's password would otherwise be a
 * privilege-escalation path (they'd learn that admin's new password from
 * this very response) — blocked the same way app/api/admin/users/[id]/
 * status/route.ts already blocks a plain ADMIN from touching another
 * admin's status: only SUPER_ADMIN may target a non-USER account.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const ip = getClientIp(req.headers);
    const limit = rateLimit(`admin-reset-password:${admin.id}:${ip}`, 10, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return apiError("User not found", 404);

    if (target.role !== "USER" && admin.role !== "SUPER_ADMIN") {
      return apiError("Only a super admin can reset an admin's password", 403);
    }

    const newPassword = generateStrongPassword();
    const passwordHash = await hashPassword(newPassword);
    const encryptedPassword = maybeEncryptPassword(newPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash, encryptedPassword },
    });

    const settings = await prisma.userSettings.findUnique({ where: { userId: id } });
    if (!settings || settings.notifyEmail) {
      const locale = resolveUserLocale(settings?.language);
      void sendMail(passwordChangedEmail(locale, target.email));
    }

    await createAuditLog({
      adminId: admin.id,
      targetUserId: id,
      action: "ADMIN_PASSWORD_RESET",
      metadata: { targetEmail: target.email },
      ipAddress: ip,
    });

    return apiSuccess({ newPassword });
  } catch (error) {
    return handleApiError(error);
  }
}
