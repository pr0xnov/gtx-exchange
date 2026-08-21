import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { verificationDecisionSchema } from "@/lib/validation/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { getClientIp } from "@/lib/rate-limit";
import { deriveVerificationStatus } from "@/lib/admin/user-summary";

/** Everything an admin needs to review one user's verification
 *  application: personal info (from the account, filled in at
 *  submission) + document metadata (never the raw bytes — those are
 *  fetched on demand via GET /api/verification/documents/[id]/file). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        country: true,
        dateOfBirth: true,
        address: true,
      },
    });
    if (!user) return apiError("User not found", 404);

    const documents = await prisma.verificationDocument.findMany({
      where: { userId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        status: true,
        rejectionReason: true,
        uploadedAt: true,
      },
    });

    return apiSuccess({
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        country: user.country,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
      },
      status: deriveVerificationStatus(documents),
      documents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Approve or reject a user's whole verification application in one
 * decision — both submitted documents move together (this app has never
 * had a per-document review step that matters to the user; see
 * lib/admin/user-summary.ts's deriveVerificationStatus, which already
 * required both document types to agree before this endpoint existed).
 * Atomic: both document rows, the user-facing Notification, and the
 * Audit Log entry are written in a single transaction.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    const documents = await prisma.verificationDocument.findMany({
      where: { userId },
      select: { id: true },
    });
    if (documents.length === 0) {
      return apiError("This user has no verification documents on file", 404);
    }

    const body = await req.json();
    const input = verificationDecisionSchema.parse(body);
    const ip = getClientIp(req.headers);

    await prisma.$transaction(async (tx) => {
      await tx.verificationDocument.updateMany({
        where: { userId },
        data: {
          status: input.decision,
          rejectionReason: input.decision === "REJECTED" ? (input.reason ?? null) : null,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          title:
            input.decision === "APPROVED"
              ? "Verification approved"
              : "Verification rejected",
          message:
            input.decision === "APPROVED"
              ? "Your account verification has been approved."
              : `Your account verification was rejected. Reason: ${input.reason}`,
        },
      });

      await createAuditLog(
        {
          adminId: admin.id,
          targetUserId: userId,
          action: "VERIFICATION_DECISION",
          metadata: {
            decision: input.decision,
            reason: input.reason ?? null,
            documentIds: documents.map((d) => d.id),
          },
          ipAddress: ip,
        },
        tx
      );
    });

    return apiSuccess({ decision: input.decision });
  } catch (error) {
    return handleApiError(error);
  }
}
