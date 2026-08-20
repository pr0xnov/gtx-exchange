import { prisma } from "@/lib/db";
import { setAuthCookies, getAccessTokenFromCookies } from "@/lib/auth/cookies";
import {
  verifyAccessToken,
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiryDate,
} from "@/lib/auth/jwt";
import type { User } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Authenticated, but the account's role doesn't permit this action —
 *  distinct from UnauthorizedError (not authenticated at all) so callers
 *  can map this to 403 instead of 401. */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
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

/**
 * The single authorization gate for every /api/admin/** route and the
 * /admin UI itself — always re-derives role from a fresh DB read via
 * requireUser() (never a client-supplied role or a JWT claim), so a
 * demoted admin's already-issued access token can't keep working past
 * this check. Throws ForbiddenError (map to 403) for a real, authenticated
 * USER — as opposed to UnauthorizedError (401) for not being logged in at
 * all, which requireUser() itself already covers.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
  return user;
}

/** For the handful of actions only SUPER_ADMIN may perform — managing
 *  other admins' roles and viewing/administering audit-log-adjacent
 *  controls a regular ADMIN shouldn't have (see app/api/admin/admins/**). */
export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Super admin access required");
  }
  return user;
}

/**
 * Issues a real access/refresh token pair and sets the auth cookies —
 * the actual "you are now logged in" step, shared by both plain login
 * (app/api/auth/login) and the 2FA completion step
 * (app/api/auth/login/2fa) so there's exactly one place that does this,
 * not two copies that could drift.
 */
export async function establishSession(user: Pick<User, "id" | "email">) {
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
}
