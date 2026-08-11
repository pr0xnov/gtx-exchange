import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken, refreshTokenExpiryDate } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { registerSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { generateLoginId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`register:${ip}`, 5, 60_000);
    if (!limit.success) {
      return apiError("Too many registration attempts. Please try again shortly.", 429);
    }

    const body = await req.json();
    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        login: generateLoginId(),
        wallet: { create: { balance: 10_000, credit: 0, currency: "USDT" } },
        settings: { create: {} },
      },
      include: { wallet: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "BONUS",
        method: "Welcome bonus",
        amount: 10_000,
        status: "COMPLETED",
      },
    });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshRecord = await prisma.refreshToken.create({
      data: {
        token: "",
        userId: user.id,
        expiresAt: refreshTokenExpiryDate(),
      },
    });
    const refreshToken = signRefreshToken({ sub: user.id, tokenId: refreshRecord.id });
    await prisma.refreshToken.update({
      where: { id: refreshRecord.id },
      data: { token: refreshToken },
    });

    await setAuthCookies(accessToken, refreshToken);

    return apiSuccess(
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          login: user.login,
        },
        wallet: user.wallet,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
