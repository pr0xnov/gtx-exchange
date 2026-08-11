import { prisma } from "@/lib/db";
import { getRefreshTokenFromCookies, clearAuthCookies } from "@/lib/auth/cookies";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST() {
  try {
    const token = await getRefreshTokenFromCookies();
    if (token) {
      await prisma.refreshToken
        .updateMany({ where: { token }, data: { revoked: true } })
        .catch(() => void 0);
    }
    await clearAuthCookies();
    return apiSuccess({ loggedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
