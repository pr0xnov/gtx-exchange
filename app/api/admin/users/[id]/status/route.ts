import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { userStatusUpdateSchema } from "@/lib/validation/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { getClientIp } from "@/lib/rate-limit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return apiError("User not found", 404);

    // A plain ADMIN changing another admin's (or their own) standing is
    // out of scope for this action — only SUPER_ADMIN manages admin
    // accounts at all (see app/api/admin/admins/[id]/route.ts).
    if (target.role !== "USER" && admin.role !== "SUPER_ADMIN") {
      return apiError("Only a super admin can change an admin's status", 403);
    }

    const body = await req.json();
    const input = userStatusUpdateSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data: { status: input.status },
    });

    await createAuditLog({
      adminId: admin.id,
      targetUserId: id,
      action: "USER_STATUS_CHANGE",
      metadata: { from: target.status, to: input.status, reason: input.reason ?? null },
      ipAddress: getClientIp(req.headers),
    });

    return apiSuccess({ status: updated.status });
  } catch (error) {
    return handleApiError(error);
  }
}
