import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  setAuthCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
} from "@/lib/auth/cookies";
import {
  verifyAccessToken,
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiryDate,
} from "@/lib/auth/jwt";
import { LOCALE_COOKIE, resolveUserLocale } from "@/lib/i18n/config";
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
 * Like getOptionalUser(), but a still-valid refresh token also counts as
 * "logged in" once the (much shorter-lived, 15m) access token has expired
 * — for display-only decisions where a merely-stale access token cookie
 * must never make an actual, still-logged-in session render as a guest
 * (e.g. the dashboard Navbar, or Markets' Favorites tab/star gating).
 *
 * Read-only: never rotates or writes any cookie itself (a Server
 * Component render can't do that anyway — Next.js only allows cookie
 * writes from a Server Action or Route Handler). The access-token cookie
 * itself only ever gets renewed by a real POST /api/auth/refresh call
 * (see hooks/use-api.ts's fetchJson), which still runs on the next
 * authenticated client-side API request. Real authorization — API
 * mutations via requireUser()/requireAdmin(), including the whole /admin
 * subtree — is completely unchanged and still requires a genuinely valid
 * access token or an explicit refresh; this function is never used there.
 */
export async function getOptionalUserAllowingRefresh() {
  const direct = await getOptionalUser();
  if (direct) return direct;

  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) return null;

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return null;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) return null;

  return prisma.user.findUnique({
    where: { id: payload.sub },
    include: { wallet: true },
  });
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
 *
 * Also syncs the locale cookie from the account's own saved
 * UserSettings.language, when one is known — the "saved account
 * language" priority level from this app's locale-detection spec,
 * for a returning user logging in on a device/browser whose own locale
 * cookie was (or would be) auto-detected differently (e.g. a new
 * browser's Accept-Language doesn't match what they actually chose
 * last time). Safe to do unconditionally because UserSettings.language
 * is never just the bare schema default in practice: registration
 * (app/api/auth/register/route.ts) seeds it from the locale already
 * active at signup, and any later manual switch (locale-context.tsx's
 * setLocale) overwrites both the cookie and this column together — so by
 * the time a user reaches login, this column already reflects either
 * their real preference or, at worst, the same locale their next
 * Accept-Language-based auto-detection would have produced anyway.
 */
export async function establishSession(
  user: Pick<User, "id" | "email"> & { settings?: { language: string } | null }
) {
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

  if (user.settings?.language) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, resolveUserLocale(user.settings.language), {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
}
