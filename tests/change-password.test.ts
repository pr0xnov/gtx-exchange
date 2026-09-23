/**
 * Regression coverage for Settings > Security > Change Password
 * (app/api/settings/password/route.ts) — added after investigating a
 * reported "UI shows success but the password doesn't actually change"
 * bug. Real functional testing against the running app (not just a code
 * read, and not just trusting a success toast — logging in with both the
 * old and new password afterward) could not reproduce that symptom; this
 * suite exists so any future regression of that exact kind is caught
 * automatically instead of silently shipping.
 *
 * Auth is exercised end to end (real JWT + real requireUser()), matching
 * tests/admin-balance-adjustment.test.ts's own approach for the same
 * reason documented there.
 */
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { generateReferralCode } from "@/lib/referral/code";
import { POST as changePassword } from "@/app/api/settings/password/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as refreshSession } from "@/app/api/auth/refresh/route";
import { resetDatabase, jsonRequest } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/email/mailer", () => ({ sendMail: vi.fn().mockResolvedValue(true) }));

const OLD_PASSWORD = "OldPass123!";
const NEW_PASSWORD = "NewPass456!";

/** Minimal in-memory cookie jar — supports both the .get() requireUser()
 *  needs and the .set()/.delete() establishSession()/clearAuthCookies()
 *  need, so the same mock works for both change-password (read-only) and
 *  login (writes fresh auth cookies) calls in this file. */
function mockCookieStore(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    get: (name: string) =>
      store.has(name) ? { name, value: store.get(name)! } : undefined,
    set: (name: string, value: string) => store.set(name, value),
    delete: (name: string) => store.delete(name),
  };
}

function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue(
    mockCookieStore({ [ACCESS_COOKIE]: token }) as never
  );
}

async function seedUserWithPassword(password: string) {
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: {
      firstName: "Test",
      lastName: "User",
      email: `pwchange-${randomUUID()}@test.gtx`,
      referralCode: generateReferralCode(),
      passwordHash,
      wallet: { create: { balance: 0, currency: "USDT" } },
    },
  });
}

function changePasswordRequest(body: unknown) {
  return jsonRequest("http://test/api/settings/password", body);
}

function loginRequest(email: string, password: string) {
  return jsonRequest("http://test/api/auth/login", { email, password });
}

function refreshRequest() {
  return jsonRequest("http://test/api/auth/refresh", {});
}

/** Logs in for real (through the actual route) and returns the refresh
 *  token JWT the server just issued, by reading it back out of the mock
 *  cookie jar's own .set() call — the same jar establishSession() writes
 *  into. Used to test that a token issued *before* a password change
 *  stops working afterward, the same way a real second device's session
 *  would. */
async function loginAndCaptureRefreshToken(
  email: string,
  password: string
): Promise<string> {
  const store = mockCookieStore();
  vi.mocked(cookies).mockResolvedValue(store as never);
  const res = await login(loginRequest(email, password));
  expect(res.status).toBe(200);
  const token = store.get(REFRESH_COOKIE)?.value;
  if (!token) throw new Error("login did not set a refresh token cookie");
  return token;
}

function withRefreshCookie(token: string) {
  vi.mocked(cookies).mockResolvedValue(
    mockCookieStore({ [REFRESH_COOKIE]: token }) as never
  );
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

describe("POST /api/settings/password", () => {
  it("changes the password when the current password is correct and the new one is valid", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);

    const res = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true, data: { changed: true } });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.passwordHash).not.toBe(user.passwordHash);
  });

  it("rejects the wrong current password and leaves the stored hash unchanged", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);

    const res = await changePassword(
      changePasswordRequest({
        currentPassword: "TotallyWrongPassword1",
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(unchanged.passwordHash).toBe(user.passwordHash);
  });

  it("rejects a new password that fails the strength policy", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);

    const res = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: "weak",
        confirmPassword: "weak",
      })
    );

    expect(res.status).toBe(422);
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(unchanged.passwordHash).toBe(user.passwordHash);
  });

  it("rejects a new/confirm password mismatch", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);

    const res = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: "SomethingElse789!",
      })
    );

    expect(res.status).toBe(422);
    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(unchanged.passwordHash).toBe(user.passwordHash);
  });

  it("end-to-end: after a successful change, the old password no longer authenticates and the new one does", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);

    const changeRes = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    expect(changeRes.status).toBe(200);

    vi.mocked(cookies).mockResolvedValue(mockCookieStore() as never);
    const oldLoginRes = await login(loginRequest(user.email, OLD_PASSWORD));
    expect(oldLoginRes.status).toBe(401);

    vi.mocked(cookies).mockResolvedValue(mockCookieStore() as never);
    const newLoginRes = await login(loginRequest(user.email, NEW_PASSWORD));
    const newLoginJson = await newLoginRes.json();
    expect(newLoginRes.status).toBe(200);
    expect(newLoginJson.success).toBe(true);
  });

  it("never returns the password hash (or the word 'hash') in the response body", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);

    const res = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    const text = await res.text();

    expect(text).not.toContain(user.passwordHash);
    expect(text.toLowerCase()).not.toContain("hash");
  });
});

describe("POST /api/settings/password — refresh token revocation", () => {
  it("revokes all of the user's previously-active refresh tokens on a successful change", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    await loginAndCaptureRefreshToken(user.email, OLD_PASSWORD);
    await loginAndCaptureRefreshToken(user.email, OLD_PASSWORD); // a second "device"

    const before = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(before).toHaveLength(2);
    expect(before.every((t) => !t.revoked)).toBe(true);

    loginAs(user);
    const res = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    expect(res.status).toBe(200);

    const after = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(after).toHaveLength(2);
    expect(after.every((t) => t.revoked)).toBe(true);
  });

  it("a refresh token issued before the password change can no longer mint a new access token", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    const staleRefreshToken = await loginAndCaptureRefreshToken(user.email, OLD_PASSWORD);

    loginAs(user);
    await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );

    withRefreshCookie(staleRefreshToken);
    const refreshRes = await refreshSession(refreshRequest());
    expect(refreshRes.status).toBe(401);
  });

  it("does not revoke another user's refresh tokens", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    const otherUser = await seedUserWithPassword("OtherPass123!");
    await loginAndCaptureRefreshToken(otherUser.email, "OtherPass123!");

    loginAs(user);
    await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );

    const otherTokens = await prisma.refreshToken.findMany({
      where: { userId: otherUser.id },
    });
    expect(otherTokens).toHaveLength(1);
    expect(otherTokens[0]!.revoked).toBe(false);
  });

  it("does not revoke any refresh tokens when the current password is wrong", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    await loginAndCaptureRefreshToken(user.email, OLD_PASSWORD);

    loginAs(user);
    const res = await changePassword(
      changePasswordRequest({
        currentPassword: "TotallyWrongPassword1",
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    expect(res.status).toBe(401);

    const tokens = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(tokens.every((t) => !t.revoked)).toBe(true);
  });

  it("leaves the password hash AND refresh tokens untouched if the update transaction fails", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    await loginAndCaptureRefreshToken(user.email, OLD_PASSWORD);

    const transactionSpy = vi
      .spyOn(prisma, "$transaction")
      .mockRejectedValueOnce(new Error("simulated transaction failure"));

    loginAs(user);
    const res = await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );
    expect(res.status).toBe(500);

    transactionSpy.mockRestore();

    const unchangedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(unchangedUser.passwordHash).toBe(user.passwordHash);

    const tokens = await prisma.refreshToken.findMany({ where: { userId: user.id } });
    expect(tokens.every((t) => !t.revoked)).toBe(true);
  });

  it("a fresh login after the password change establishes a normal, working new session", async () => {
    const user = await seedUserWithPassword(OLD_PASSWORD);
    loginAs(user);
    await changePassword(
      changePasswordRequest({
        currentPassword: OLD_PASSWORD,
        newPassword: NEW_PASSWORD,
        confirmPassword: NEW_PASSWORD,
      })
    );

    const newRefreshToken = await loginAndCaptureRefreshToken(user.email, NEW_PASSWORD);

    withRefreshCookie(newRefreshToken);
    const refreshRes = await refreshSession(refreshRequest());
    expect(refreshRes.status).toBe(200);
  });
});
