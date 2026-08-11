import { prisma } from "@/lib/db";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Resolves the current user from the access token cookie.
 * Throws UnauthorizedError if missing/invalid — callers (API routes) should
 * catch this and return a 401.
 */
export async function requireUser() {
  const token = await getAccessTokenFromCookies();
  if (!token) throw new UnauthorizedError("Not authenticated");

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { wallet: true },
  });

  if (!user) throw new UnauthorizedError("User not found");
  return user;
}

/** Non-throwing variant for optional-auth pages/components. */
export async function getOptionalUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}
