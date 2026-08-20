import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { profileUpdateSchema } from "@/lib/validation/settings";
import { apiSuccess, handleApiError } from "@/lib/api-response";

/** First/last name only — email has its own verification-token flow
 *  (see app/api/settings/email/request and .../confirm) since changing it
 *  is security-sensitive in a way a display name isn't. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const input = profileUpdateSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { firstName: input.firstName, lastName: input.lastName },
    });

    return apiSuccess({
      firstName: updated.firstName,
      lastName: updated.lastName,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
