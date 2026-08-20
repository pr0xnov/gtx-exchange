import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyLoginChallengeToken } from "@/lib/auth/jwt";
import { establishSession } from "@/lib/auth/session";
import { verifyTotpCode } from "@/lib/auth/totp";
import { decryptSecret } from "@/lib/auth/crypto";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit/log";

const verify2faLoginSchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Completes a login that /api/auth/login deferred because the account
 *  has 2FA on — the second half of that same sign-in attempt, not a
 *  separate feature. Issues the real session only once the code checks out. */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`login-2fa:${ip}`, 10, 60_000);
    if (!limit.success) {
      return apiError("Too many attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = verify2faLoginSchema.parse(body);

    let challenge;
    try {
      challenge = verifyLoginChallengeToken(input.challengeToken);
    } catch {
      return apiError("Login expired — please sign in again", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: challenge.sub },
      include: { wallet: true, settings: true },
    });
    if (!user?.settings?.twoFactorOn || !user.settings.twoFactorSecret) {
      return apiError("Login expired — please sign in again", 401);
    }

    // Re-checked here too, not just in /api/auth/login before the
    // challenge token was issued — this is the call that actually grants
    // a session, so it's the one that must be correct even if status
    // somehow changed in the gap between the two requests.
    if (user.status !== "ACTIVE") {
      return apiError(
        user.status === "BLOCKED"
          ? "This account has been blocked. Please contact support."
          : "This account is suspended. Please contact support.",
        403
      );
    }

    const secret = decryptSecret(user.settings.twoFactorSecret);
    const valid = verifyTotpCode(secret, input.code);
    if (!valid) {
      return apiError("Invalid verification code", 401);
    }

    await establishSession(user);

    if (user.role !== "USER") {
      await createAuditLog({
        adminId: user.id,
        targetUserId: user.id,
        action: "ADMIN_LOGIN",
        ipAddress: ip,
      });
    }

    return apiSuccess({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.login,
        role: user.role,
      },
      wallet: user.wallet,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
