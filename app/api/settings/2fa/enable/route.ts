import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { verifyTwoFaSetupToken } from "@/lib/auth/jwt";
import { verifyTotpCode } from "@/lib/auth/totp";
import { encryptSecret } from "@/lib/auth/crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const enable2faSchema = z.object({
  setupToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = getClientIp(req.headers);
    const limit = rateLimit(`2fa-enable:${user.id}:${ip}`, 10, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = enable2faSchema.parse(body);

    let setupPayload;
    try {
      setupPayload = verifyTwoFaSetupToken(input.setupToken);
    } catch {
      return apiError("2FA setup expired — please restart setup", 400);
    }
    // The setup token is bound to whoever generated it — a stolen token
    // still can't be redeemed by a different logged-in session's user.
    if (setupPayload.sub !== user.id) {
      return apiError("2FA setup expired — please restart setup", 400);
    }

    const valid = verifyTotpCode(setupPayload.secret, input.code);
    if (!valid) {
      return apiError("Invalid verification code", 401);
    }

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { twoFactorOn: true, twoFactorSecret: encryptSecret(setupPayload.secret) },
      create: {
        userId: user.id,
        twoFactorOn: true,
        twoFactorSecret: encryptSecret(setupPayload.secret),
      },
    });

    return apiSuccess({ twoFactorOn: true });
  } catch (error) {
    return handleApiError(error);
  }
}
