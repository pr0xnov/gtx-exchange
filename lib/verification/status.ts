import { prisma } from "@/lib/db";

/**
 * There is no aggregate "verified" field anywhere on `User` — status only
 * exists per-document on `VerificationDocument` (IDENTITY/PROOF_OF_ADDRESS,
 * each PENDING/APPROVED/REJECTED). Nothing in this app ever moves a
 * document to APPROVED — there is no admin/reviewer flow at all — so
 * requiring APPROVED here would make withdrawal permanently impossible
 * for every user, including one who did everything the app currently
 * lets them do. "Verified" is instead operationalized as: has submitted
 * both required document types through the existing verification form,
 * with neither rejected — the only "completed verification" state a user
 * can actually reach via this app today.
 */
export async function isUserVerified(userId: string): Promise<boolean> {
  const docs = await prisma.verificationDocument.findMany({
    where: { userId },
    select: { type: true, status: true },
  });

  const submitted = (type: "IDENTITY" | "PROOF_OF_ADDRESS") =>
    docs.some((d) => d.type === type && d.status !== "REJECTED");

  return submitted("IDENTITY") && submitted("PROOF_OF_ADDRESS");
}
