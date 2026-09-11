import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signLoginChallengeToken } from "@/lib/auth/jwt";
import { establishSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getTrustedClientIp, getDeviceHash } from "@/lib/security/client-ip";
import { createAuditLog } from "@/lib/audit/log";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`login:${ip}`, 10, 60_000);
    if (!limit.success) {
      return apiError("Too many login attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { wallet: true, settings: true },
    });

    // Constant-shape response to avoid leaking which emails exist.
    const invalidCreds = () => apiError("Invalid email or password", 401);

    if (!user) return invalidCreds();

    const validPassword = await verifyPassword(input.password, user.passwordHash);
    if (!validPassword) return invalidCreds();

    if (user.status !== "ACTIVE") {
      return apiError(
        user.status === "BLOCKED"
          ? "This account has been blocked. Please contact support."
          : "This account is suspended. Please contact support.",
        403
      );
    }

    if (user.settings?.twoFactorOn) {
      // Password is correct, but no session yet — the client must submit
      // this challenge token + a TOTP code to /api/auth/login/2fa before
      // any auth cookie is set. Keeps 2FA a real second factor on login
      // itself, not just a Settings toggle nothing else checks.
      const challengeToken = signLoginChallengeToken({ sub: user.id });
      return apiSuccess({ requires2FA: true, challengeToken });
    }

    await establishSession(user);

    // Anti-abuse signal for the first-deposit bonus (lib/bonus/first-
    // deposit.ts) — refreshed on every login so it reflects the most
    // recent known connection, not just the one at signup. Best-effort:
    // never blocks or delays the login response.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastKnownIp: getTrustedClientIp(req.headers),
        lastKnownDeviceHash: getDeviceHash(req.headers),
      },
    });

    // Only admin logins, not every routine user sign-in — an
    // administrative event log, not a general access log (see
    // lib/audit/log.ts's own doc comment on what belongs here).
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
