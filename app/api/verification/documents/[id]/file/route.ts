import { prisma } from "@/lib/db";
import { requireUser, requireSuperAdmin } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { createAuditLog } from "@/lib/audit/log";
import { getClientIp } from "@/lib/rate-limit";

/**
 * The `Headers`/`Response` API only accepts ByteString (Latin-1) header
 * values — any character above code point 255 (e.g. Cyrillic, CJK,
 * emoji — completely normal in a phone-camera or user-provided file
 * name) makes the `Response` constructor throw, which this route's
 * try/catch turned into a 500 JSON error instead of the image. The
 * browser's <img> tag then rendered that as a broken image, which is
 * exactly the bug this fixes. RFC 6266/5987's `filename*=UTF-8''...`
 * form is the standard way to carry a non-ASCII filename in this header;
 * pairing it with an ASCII-sanitized `filename="..."` keeps very old
 * clients working too. `encodeURIComponent`'s output is pure ASCII, so
 * this can never throw the same way regardless of what's in fileName.
 */
function contentDispositionHeader(fileName: string): string {
  const asciiFallback =
    fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") || "document";
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Serves a verification document's raw bytes — the single, shared path
 * both a user's own /verification page AND the Admin Panel's review
 * screen use to actually open a document (see the "Not just a filename —
 * the file must be viewable" requirement this was built for).
 *
 * Access is allowed for exactly two cases, checked server-side on every
 * request (never inferred from what the frontend happens to show):
 *   1. the caller IS the document's owner (self-view), or
 *   2. the caller is ADMIN/SUPER_ADMIN (review).
 * Anyone else — including an authenticated USER trying another user's
 * document id — gets 403. Never cached/publicly guessable: no public
 * URL exists for these bytes outside this authenticated route.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const document = await prisma.verificationDocument.findUnique({ where: { id } });
    if (!document) return apiError("Document not found", 404);

    const isOwner = document.userId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isOwner && !isAdmin) {
      return apiError("Forbidden", 403);
    }

    if (!document.fileData) {
      return apiError(
        "This document has no file on record (submitted before file storage was added)",
        404
      );
    }

    return new Response(new Uint8Array(document.fileData), {
      status: 200,
      headers: {
        "Content-Type": document.mimeType ?? "application/octet-stream",
        "Content-Disposition": contentDispositionHeader(document.fileName),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Deletes one verification document — SUPER_ADMIN only (stricter than
 * GET above, which also allows the owner and a plain ADMIN: viewing your
 * own document is harmless, but permanently destroying KYC evidence is
 * reserved for the top role). There is no separate filesystem/object
 * storage to clean up — the file's bytes live only in this row
 * (VerificationDocument.fileData), so deleting the row *is* deleting the
 * file. Removes only this one document; the user's other document and
 * account are untouched.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id } = await params;

    const document = await prisma.verificationDocument.findUnique({ where: { id } });
    if (!document) return apiError("Document not found", 404);

    const ip = getClientIp(req.headers);
    await prisma.$transaction(async (tx) => {
      await tx.verificationDocument.delete({ where: { id } });
      await createAuditLog(
        {
          adminId: admin.id,
          targetUserId: document.userId,
          action: "ADMIN_DELETED_VERIFICATION_DOCUMENT",
          metadata: { documentId: id, type: document.type, fileName: document.fileName },
          ipAddress: ip,
        },
        tx
      );
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
