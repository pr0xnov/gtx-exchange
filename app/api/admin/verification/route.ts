import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { deriveVerificationStatus } from "@/lib/admin/user-summary";

/**
 * Every user who has ever submitted verification documents — not just a
 * PENDING work queue — so an admin can also look up someone already
 * VERIFIED or REJECTED (see /admin/verification/[userId]). Grouped by
 * user rather than listing documents individually: a decision here is
 * made per user (Approve/Reject the whole application), not per file.
 */
export async function GET() {
  try {
    await requireAdmin();

    const documents = await prisma.verificationDocument.findMany({
      orderBy: { uploadedAt: "desc" },
      // Explicit select — never pull fileData here. This just builds a
      // per-user summary list; fetching every document's full binary
      // content (potentially many MB across the whole queue) to compute
      // a count and a status would be pure waste.
      select: {
        userId: true,
        status: true,
        type: true,
        uploadedAt: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const byUser = new Map<
      string,
      {
        user: { id: string; firstName: string; lastName: string; email: string };
        docs: {
          status: "PENDING" | "APPROVED" | "REJECTED";
          type: "IDENTITY" | "PROOF_OF_ADDRESS";
        }[];
        documentCount: number;
        updatedAt: Date;
      }
    >();

    for (const doc of documents) {
      const existing = byUser.get(doc.userId);
      if (existing) {
        existing.docs.push({ status: doc.status, type: doc.type });
        existing.documentCount += 1;
        if (doc.uploadedAt > existing.updatedAt) existing.updatedAt = doc.uploadedAt;
      } else {
        byUser.set(doc.userId, {
          user: doc.user,
          docs: [{ status: doc.status, type: doc.type }],
          documentCount: 1,
          updatedAt: doc.uploadedAt,
        });
      }
    }

    const rows = [...byUser.values()]
      .map((entry) => ({
        id: entry.user.id,
        firstName: entry.user.firstName,
        lastName: entry.user.lastName,
        email: entry.user.email,
        status: deriveVerificationStatus(entry.docs),
        documentCount: entry.documentCount,
        updatedAt: entry.updatedAt,
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return apiSuccess(rows);
  } catch (error) {
    return handleApiError(error);
  }
}
