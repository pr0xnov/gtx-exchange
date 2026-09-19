import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { verificationSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { deriveVerificationStatus } from "@/lib/admin/user-summary";
import { rateLimit } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — plenty for a photographed ID/utility bill

// Explicit allowlist, not `type.startsWith("image/")` — that wildcard let
// image/svg+xml through, and an SVG can carry an embedded <script> that
// runs if the document is ever opened/rendered directly (a stored-XSS risk
// for whoever views it, e.g. an admin reviewing the submission). No raster
// format that's actually scriptable belongs here, so the fix is a
// closed list, not a smarter SVG-specific check.
const ALLOWED_MIME_TO_EXT: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
};

function fileExtension(name: string): string {
  return name.slice(name.lastIndexOf(".") + 1).toLowerCase();
}

/** MIME type alone is just what the browser/client declared, not verified
 *  server-side — also require the filename's extension to be plausible for
 *  that declared type, so a file can't claim to be a PNG while actually
 *  named (or crafted as) something else entirely. */
function isAllowedDocument(file: File): boolean {
  const allowedExts = ALLOWED_MIME_TO_EXT[file.type];
  if (!allowedExts) return false;
  return allowedExts.includes(fileExtension(file.name));
}

function readFile(form: FormData, field: string): File | null {
  const value = form.get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

/**
 * Submits (or re-submits) a verification application: personal info +
 * both required documents, in one multipart request. A fresh submission
 * always REPLACES the user's existing VerificationDocument rows rather
 * than adding to them — deriveVerificationStatus() treats any REJECTED
 * row as permanently REJECTED regardless of what else exists, so leaving
 * old rejected rows in place after a resubmission would make "correct and
 * resubmit" (section 10 of this feature's spec) impossible to ever
 * recover from. Exactly two rows (IDENTITY + PROOF_OF_ADDRESS) exist for
 * a user at any time — this endpoint is the only writer.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const limit = rateLimit(`verification-upload:${user.id}`, 5, 60_000);
    if (!limit.success) {
      return apiError(
        "Too many verification submissions. Please try again shortly.",
        429
      );
    }

    const form = await req.formData();
    const input = verificationSchema.parse({
      country: form.get("country"),
      dateOfBirth: form.get("dateOfBirth"),
      address: form.get("address"),
    });

    const identityFile = readFile(form, "identityFile");
    const addressFile = readFile(form, "addressFile");
    if (!identityFile) return apiError("Identity document is required", 422);
    if (!addressFile) return apiError("Proof of address is required", 422);

    for (const file of [identityFile, addressFile]) {
      if (file.size > MAX_FILE_SIZE) {
        return apiError(`${file.name} is too large (max 5MB)`, 422);
      }
      if (!isAllowedDocument(file)) {
        return apiError(`${file.name} must be a PNG, JPEG, WEBP image, or a PDF`, 422);
      }
    }

    const [identityBuffer, addressBuffer] = await Promise.all([
      identityFile.arrayBuffer().then(Buffer.from),
      addressFile.arrayBuffer().then(Buffer.from),
    ]);

    const [identity, address] = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          country: input.country,
          dateOfBirth: new Date(input.dateOfBirth),
          address: input.address,
        },
      });
      await tx.verificationDocument.deleteMany({ where: { userId: user.id } });
      const createdIdentity = await tx.verificationDocument.create({
        data: {
          userId: user.id,
          type: "IDENTITY",
          fileName: identityFile.name,
          fileData: identityBuffer,
          mimeType: identityFile.type,
        },
      });
      const createdAddress = await tx.verificationDocument.create({
        data: {
          userId: user.id,
          type: "PROOF_OF_ADDRESS",
          fileName: addressFile.name,
          fileData: addressBuffer,
          mimeType: addressFile.type,
        },
      });
      return [createdIdentity, createdAddress];
    });

    return apiSuccess(
      {
        identity: { id: identity.id, fileName: identity.fileName },
        address: { id: address.id, fileName: address.fileName },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/** The current user's own verification state — status, personal info, and
 *  document metadata (never the raw file bytes; those are fetched
 *  on-demand via GET /api/verification/documents/[id]/file). */
export async function GET() {
  try {
    const user = await requireUser();
    const documents = await prisma.verificationDocument.findMany({
      where: { userId: user.id },
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

    const status = deriveVerificationStatus(documents);
    const rejectionReason =
      documents.find((d) => d.rejectionReason)?.rejectionReason ?? null;

    return apiSuccess({
      status,
      rejectionReason,
      profile: {
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        country: user.country,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
      },
      documents,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
