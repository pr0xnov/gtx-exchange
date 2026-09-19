/**
 * Coverage for the automatic access-token-refresh fix:
 *  - getOptionalUserAllowingRefresh() (lib/auth/session.ts) — the
 *    SSR-layer fallback that stops /markets and the dashboard layout from
 *    rendering a still-logged-in user as a guest once their 15m access
 *    token has expired, as long as their refresh token is still valid.
 *  - POST /api/auth/refresh (previously untested) — the endpoint that
 *    fallback and the client-side retry (hooks/use-api.ts) both rely on.
 *
 * Exercises the real JWT verify + DB lookups (only `next/headers`'s
 * cookies() is mocked, the same pattern as tests/admin-authorization.test.ts)
 * rather than mocking lib/auth/session.ts's own exports, since
 * getOptionalUserAllowingRefresh() calls the module's own
 * getOptionalUser()/requireUser() internally — a `vi.mock` of the exported
 * binding wouldn't intercept that internal call.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiryDate,
} from "@/lib/auth/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { getOptionalUserAllowingRefresh } from "@/lib/auth/session";
import { POST as postRefresh } from "@/app/api/auth/refresh/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { UserWithWallet } from "./helpers";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

// POST /api/auth/refresh is now rate-limited by client IP, which reads
// off the request object rather than an ambient context.
function refreshRequest() {
  return new NextRequest("http://test/api/auth/refresh", { method: "POST" });
}

function setCookies(values: { access?: string; refresh?: string }) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => {
      if (name === ACCESS_COOKIE && values.access) return { name, value: values.access };
      if (name === REFRESH_COOKIE && values.refresh)
        return { name, value: values.refresh };
      return undefined;
    },
    // POST /api/auth/refresh writes new cookies on success (setAuthCookies)
    // and clears them on failure (clearAuthCookies) — no-ops here since
    // these tests only assert on the response/DB state, not on what the
    // real cookie jar would end up holding.
    set: vi.fn(),
    delete: vi.fn(),
  } as never);
}

/** A real, DB-tracked, not-yet-revoked refresh token for `user` — the same
 *  shape establishSession()/the refresh route itself create. */
async function issueRefreshToken(user: UserWithWallet, overrides?: { expiresAt?: Date }) {
  const record = await prisma.refreshToken.create({
    data: {
      token: "",
      userId: user.id,
      expiresAt: overrides?.expiresAt ?? refreshTokenExpiryDate(),
    },
  });
  const token = signRefreshToken({ sub: user.id, tokenId: record.id });
  await prisma.refreshToken.update({ where: { id: record.id }, data: { token } });
  return token;
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.mocked(cookies).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("getOptionalUserAllowingRefresh — valid access token", () => {
  it("returns the user without ever looking at the refresh token", async () => {
    const user = await seedUserWithWallet(0);
    setCookies({ access: signAccessToken({ sub: user.id, email: user.email }) });

    const result = await getOptionalUserAllowingRefresh();
    expect(result?.id).toBe(user.id);
  });
});

describe("getOptionalUserAllowingRefresh — expired/missing access token", () => {
  it("falls back to a still-valid refresh token and returns the user", async () => {
    const user = await seedUserWithWallet(0);
    const refresh = await issueRefreshToken(user);
    setCookies({ refresh }); // no access cookie at all — same as expired-and-dropped

    const result = await getOptionalUserAllowingRefresh();
    expect(result?.id).toBe(user.id);
  });

  it("returns null when there is no refresh token either (a real guest)", async () => {
    setCookies({});
    const result = await getOptionalUserAllowingRefresh();
    expect(result).toBeNull();
  });

  it("returns null for a garbage/invalid refresh token", async () => {
    setCookies({ refresh: "not-a-real-jwt" });
    const result = await getOptionalUserAllowingRefresh();
    expect(result).toBeNull();
  });

  it("returns null once the refresh token has been revoked (e.g. by a later /api/auth/refresh rotation)", async () => {
    const user = await seedUserWithWallet(0);
    const refresh = await issueRefreshToken(user);
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });
    setCookies({ refresh });

    const result = await getOptionalUserAllowingRefresh();
    expect(result).toBeNull();
  });

  it("returns null once the refresh token's own DB record has expired", async () => {
    const user = await seedUserWithWallet(0);
    const refresh = await issueRefreshToken(user, {
      expiresAt: new Date(Date.now() - 1000),
    });
    setCookies({ refresh });

    const result = await getOptionalUserAllowingRefresh();
    expect(result).toBeNull();
  });
});

describe("POST /api/auth/refresh", () => {
  it("issues a new access token and rotates the refresh token when the current one is valid", async () => {
    const user = await seedUserWithWallet(0);
    const refresh = await issueRefreshToken(user);
    setCookies({ refresh });

    const res = await postRefresh(refreshRequest());
    expect(res.status).toBe(200);

    const before = await prisma.refreshToken.findUnique({ where: { token: refresh } });
    expect(before?.revoked).toBe(true); // old one rotated out, can't be replayed

    const stillValid = await prisma.refreshToken.count({
      where: { userId: user.id, revoked: false },
    });
    expect(stillValid).toBe(1); // exactly one live replacement issued
  });

  it("401s with no refresh cookie at all", async () => {
    setCookies({});
    const res = await postRefresh(refreshRequest());
    expect(res.status).toBe(401);
  });

  it("401s for a revoked refresh token (can't be replayed after rotation)", async () => {
    const user = await seedUserWithWallet(0);
    const refresh = await issueRefreshToken(user);
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });
    setCookies({ refresh });

    const res = await postRefresh(refreshRequest());
    expect(res.status).toBe(401);
  });

  it("401s for an expired refresh token record", async () => {
    const user = await seedUserWithWallet(0);
    const refresh = await issueRefreshToken(user, {
      expiresAt: new Date(Date.now() - 1000),
    });
    setCookies({ refresh });

    const res = await postRefresh(refreshRequest());
    expect(res.status).toBe(401);
  });
});
