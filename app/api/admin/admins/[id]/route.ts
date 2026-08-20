import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/session";
import { roleUpdateSchema } from "@/lib/validation/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Promotes a USER to ADMIN, or demotes an ADMIN back to USER — the only
 * role transition exposed anywhere in the app. SUPER_ADMIN is never
 * assignable here (roleUpdateSchema itself only accepts USER/ADMIN) and a
 * SUPER_ADMIN can't be demoted through this endpoint either, so the
 * top role can only ever be granted via scripts/create-admin.ts.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await requireSuperAdmin();
    const { id } = await params;

    if (id === superAdmin.id) {
      return apiError("You cannot change your own role", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return apiError("User not found", 404);
    if (target.role === "SUPER_ADMIN") {
      return apiError("Super admin role cannot be changed here", 403);
    }

    const body = await req.json();
    const input = roleUpdateSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data: { role: input.role },
    });

    await createAuditLog({
      adminId: superAdmin.id,
      targetUserId: id,
      action: "ADMIN_ROLE_CHANGE",
      metadata: { from: target.role, to: input.role },
      ipAddress: getClientIp(req.headers),
    });

    return apiSuccess({ role: updated.role });
  } catch (error) {
    return handleApiError(error);
  }
}
