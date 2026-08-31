import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { depositSchema } from "@/lib/validation/trading";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

const METHOD_LABELS: Record<string, string> = {
  TETHER_USDT: "Tether (USDT)",
};

// Screenshots only — deliberately narrower than Verification's own
// image-or-PDF allowance (a payment-confirmation screenshot is never a
// PDF in practice, and restricting it keeps the "Payment confirmation"
// preview in Admin always an <img>, never a "can't preview" fallback).
const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5MB, same cap as Verification's own uploads
const ALLOWED_PROOF_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

/**
 * A deposit request now requires a payment-confirmation screenshot
 * before it's created at all — this is a multipart request (like
 * POST /api/verification), not JSON, precisely so the proof travels in
 * the same request as amount/method/network rather than needing a
 * second endpoint or a client-side "create then attach" two-step that
 * could leave a PENDING deposit with no proof if the second step failed.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const form = await req.formData();
    const input = depositSchema.parse({
      amount: form.get("amount"),
      method: form.get("method"),
      network: form.get("network"),
    });

    const proof = form.get("proof");
    if (!(proof instanceof File) || proof.size === 0) {
      return apiError("A payment confirmation screenshot is required", 422);
    }
    if (proof.size > MAX_PROOF_SIZE) {
      return apiError("Screenshot is too large (max 5MB)", 422);
    }
    if (!ALLOWED_PROOF_MIME.has(proof.type)) {
      return apiError("Screenshot must be a PNG, JPG, JPEG, or WEBP image", 422);
    }
    const proofBuffer = Buffer.from(await proof.arrayBuffer());

    // Deposits no longer credit the balance on creation — an admin must
    // approve the request first (see PATCH /api/admin/transactions/[id]),
    // same admin-decision step Withdrawal already has. Balance (the Spot
    // USDT wallet — see app/api/account/summary/route.ts) is untouched
    // here.
    const result = await prisma.$transaction(async (tx) => {
      // Explicit select, never the full row: `proofData` is the raw
      // screenshot bytes — same reasoning as VerificationDocument's own
      // fileData never being bundled into a JSON response (see
      // app/api/verification/route.ts) — it must only ever leave the
      // server through the protected GET below.
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          method: METHOD_LABELS[input.method],
          network: input.network,
          amount: input.amount,
          asset: "USDT",
          status: "PENDING",
          proofFileName: proof.name,
          proofData: proofBuffer,
          proofMimeType: proof.type,
        },
        select: {
          id: true,
          type: true,
          method: true,
          network: true,
          amount: true,
          asset: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Deposit request received",
          message: `Your deposit of ${input.amount} USDT is pending approval.`,
        },
      });

      return transaction;
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
