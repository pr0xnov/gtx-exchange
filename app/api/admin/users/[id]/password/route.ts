import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/session";
import {
  decryptPassword,
  isPasswordEncryptionConfigured,
} from "@/lib/auth/password-crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * SUPER_ADMIN-only "Show password" endpoint. requireSuperAdmin() re-checks
 * role fresh from the DB on every call (never a cached/client-supplied
 * role) — a plain ADMIN or USER hitting this directly gets a real 403, a
 * signed-out caller a real 401, regardless of what the frontend renders.
 * Every successful reveal is written to the append-only Audit Log with who
 * viewed whose password and when — the password itself never appears in
 * that log entry, in server logs, or in an error message.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;

    const ip = getClientIp(req.headers);
    const limit = rateLimit(`admin-view-password:${admin.id}:${ip}`, 20, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    if (!isPasswordEncryptionConfigured()) {
      return apiError(
        "Password viewing is not configured on this server (PASSWORD_ENCRYPTION_KEY missing).",
        500
      );
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, encryptedPassword: true },
    });
    if (!target) return apiError("User not found", 404);

    if (!target.encryptedPassword) {
      return apiSuccess({ available: false });
    }

    const password = decryptPassword(target.encryptedPassword);

    await createAuditLog({
      adminId: admin.id,
      targetUserId: target.id,
      action: "ADMIN_PASSWORD_VIEWED",
      metadata: { targetEmail: target.email },
      ipAddress: ip,
    });

    return apiSuccess({ available: true, password });
  } catch (error) {
    return handleApiError(error);
  }
}
