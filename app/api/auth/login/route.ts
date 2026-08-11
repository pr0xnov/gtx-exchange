import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, refreshTokenExpiryDate } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { loginSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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
      include: { wallet: true },
    });

    // Constant-shape response to avoid leaking which emails exist.
    const invalidCreds = () => apiError("Invalid email or password", 401);

    if (!user) return invalidCreds();

    const validPassword = await verifyPassword(input.password, user.passwordHash);
    if (!validPassword) return invalidCreds();

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshRecord = await prisma.refreshToken.create({
      data: { token: "", userId: user.id, expiresAt: refreshTokenExpiryDate() },
    });
    const refreshToken = signRefreshToken({ sub: user.id, tokenId: refreshRecord.id });
    await prisma.refreshToken.update({
      where: { id: refreshRecord.id },
      data: { token: refreshToken },
    });

    await setAuthCookies(accessToken, refreshToken);

    return apiSuccess({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        login: user.login,
      },
      wallet: user.wallet,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
