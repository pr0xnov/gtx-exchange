import { prisma } from "@/lib/db";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiryDate,
} from "@/lib/auth/jwt";
import {
  getRefreshTokenFromCookies,
  setAuthCookies,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limit = rateLimit(`refresh:${ip}`, 30, 60_000);
    if (!limit.success) {
      return apiError("Too many refresh attempts. Please try again shortly.", 429);
    }

    const token = await getRefreshTokenFromCookies();
    if (!token) return apiError("No refresh token provided", 401);

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      await clearAuthCookies();
      return apiError("Invalid or expired refresh token", 401);
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      await clearAuthCookies();
      return apiError("Refresh token no longer valid", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      await clearAuthCookies();
      return apiError("User not found", 401);
    }

    // Rotate: revoke old, issue new (prevents replay of stolen tokens).
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const newAccessToken = signAccessToken({ sub: user.id, email: user.email });
    const newRecord = await prisma.refreshToken.create({
      data: { token: "", userId: user.id, expiresAt: refreshTokenExpiryDate() },
    });
    const newRefreshToken = signRefreshToken({ sub: user.id, tokenId: newRecord.id });
    await prisma.refreshToken.update({
      where: { id: newRecord.id },
      data: { token: newRefreshToken },
    });

    await setAuthCookies(newAccessToken, newRefreshToken);

    return apiSuccess({ refreshed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
