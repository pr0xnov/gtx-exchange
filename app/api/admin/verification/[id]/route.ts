import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { verificationDecisionSchema } from "@/lib/validation/admin";
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

    const document = await prisma.verificationDocument.findUnique({ where: { id } });
    if (!document) return apiError("Document not found", 404);

    const body = await req.json();
    const input = verificationDecisionSchema.parse(body);

    const updated = await prisma.verificationDocument.update({
      where: { id },
      data: { status: input.decision },
    });

    await prisma.notification.create({
      data: {
        userId: document.userId,
        title: input.decision === "APPROVED" ? "Document approved" : "Document rejected",
        message:
          input.decision === "APPROVED"
            ? `Your ${document.type.replace("_", " ").toLowerCase()} document was approved.`
            : `Your ${document.type.replace("_", " ").toLowerCase()} document was rejected. Please re-upload a valid document.`,
      },
    });

    await createAuditLog({
      adminId: admin.id,
      targetUserId: document.userId,
      action: "VERIFICATION_DECISION",
      metadata: {
        documentId: id,
        documentType: document.type,
        decision: input.decision,
        note: input.note ?? null,
      },
      ipAddress: getClientIp(req.headers),
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
