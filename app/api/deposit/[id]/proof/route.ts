import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { apiError, handleApiError } from "@/lib/api-response";

/**
 * Serves a deposit's payment-confirmation screenshot — the single,
 * protected path both the user's own /history and the Admin Panel's
 * per-user Deposits tab use to actually open it. Mirrors GET
 * /api/verification/documents/[id]/file exactly (same ByteString-safe
 * Content-Disposition handling, same owner-or-admin access check): the
 * caller must either own the deposit or be ADMIN/SUPER_ADMIN, checked
 * server-side on every request, never inferred from what the frontend
 * happens to show. Never cached/publicly guessable — no public URL
 * exists for these bytes outside this authenticated route.
 */
function contentDispositionHeader(fileName: string): string {
  const asciiFallback =
    fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") || "screenshot";
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: {
        userId: true,
        type: true,
        proofData: true,
        proofMimeType: true,
        proofFileName: true,
      },
    });
    if (!transaction || transaction.type !== "DEPOSIT") {
      return apiError("Deposit not found", 404);
    }

    const isOwner = transaction.userId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
      return apiError("Forbidden", 403);
    }

    if (!transaction.proofData) {
      return apiError("This deposit has no payment confirmation on record", 404);
    }

    return new Response(new Uint8Array(transaction.proofData), {
      status: 200,
      headers: {
        "Content-Type": transaction.proofMimeType ?? "application/octet-stream",
        "Content-Disposition": contentDispositionHeader(
          transaction.proofFileName ?? "screenshot"
        ),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
