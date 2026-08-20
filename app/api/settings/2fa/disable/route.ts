import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { disable2faSchema } from "@/lib/validation/settings";
import { verifyTotpCode } from "@/lib/auth/totp";
import { decryptSecret } from "@/lib/auth/crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = getClientIp(req.headers);
    const limit = rateLimit(`2fa-disable:${user.id}:${ip}`, 10, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = disable2faSchema.parse(body);

    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    if (!settings?.twoFactorOn || !settings.twoFactorSecret) {
      return apiError("2FA is not enabled", 400);
    }

    const secret = decryptSecret(settings.twoFactorSecret);
    const valid = verifyTotpCode(secret, input.code);
    if (!valid) {
      return apiError("Invalid verification code", 401);
    }

    await prisma.userSettings.update({
      where: { userId: user.id },
      data: { twoFactorOn: false, twoFactorSecret: null },
    });

    return apiSuccess({ twoFactorOn: false });
  } catch (error) {
    return handleApiError(error);
  }
}
