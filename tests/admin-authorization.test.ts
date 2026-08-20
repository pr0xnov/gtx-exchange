/**
 * Backend authorization for the Admin Panel — a plain USER must be
 * rejected by /api/admin/** with a real 403 (not just a hidden UI
 * element), an ADMIN must be let in, and the SUPER_ADMIN-only endpoints
 * must reject a regular ADMIN too.
 *
 * Exercises the REAL requireUser() -> requireAdmin()/requireSuperAdmin()
 * chain end to end (real JWT verify, real DB role lookup) rather than
 * mocking any of lib/auth/session.ts's exports directly — requireAdmin()
 * calls its own module-internal requireUser(), which a `vi.mock` of the
 * exported binding alone doesn't intercept (ESM bindings aren't rebound
 * by spreading them into a replacement object), so the only reliable way
 * to test its actual role-check logic is to let the whole chain run for
 * real. Only `next/headers`'s `cookies()` is mocked, to hand it a real,
 * validly-signed access token for whichever test user each case needs.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { GET as getUsers } from "@/app/api/admin/users/route";
import { GET as getAdmins } from "@/app/api/admin/admins/route";
import { GET as getDashboard } from "@/app/api/admin/dashboard/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

/** Signs a real access token for `user` and makes the mocked cookies()
 *  hand it back, so requireUser() (and everything built on it) runs its
 *  actual JWT-verify + DB-lookup logic against a real session. */
function loginAs(user: User) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === ACCESS_COOKIE ? { name, value: token } : undefined),
  } as never);
}

function loggedOut() {
  vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as never);
}

function listRequest(url: string) {
  return new NextRequest(url);
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

describe("Admin authorization — a plain USER", () => {
  it("gets 403 from GET /api/admin/users", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const res = await getUsers(listRequest("http://test/api/admin/users"));
    expect(res.status).toBe(403);
  });

  it("gets 403 from GET /api/admin/dashboard", async () => {
    const user = await seedUserWithWallet(0);
    loginAs(user);

    const res = await getDashboard();
    expect(res.status).toBe(403);
  });
});

describe("Admin authorization — an ADMIN", () => {
  it("can access GET /api/admin/users", async () => {
    const user = await seedUserWithWallet(0);
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    loginAs(user);

    const res = await getUsers(listRequest("http://test/api/admin/users"));
    expect(res.status).toBe(200);
  });

  it("gets 403 from the SUPER_ADMIN-only GET /api/admin/admins", async () => {
    const user = await seedUserWithWallet(0);
    await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
    loginAs(user);

    const res = await getAdmins();
    expect(res.status).toBe(403);
  });
});

describe("Admin authorization — a SUPER_ADMIN", () => {
  it("can access GET /api/admin/admins", async () => {
    const user = await seedUserWithWallet(0);
    await prisma.user.update({ where: { id: user.id }, data: { role: "SUPER_ADMIN" } });
    loginAs(user);

    const res = await getAdmins();
    expect(res.status).toBe(200);
  });
});

describe("Admin authorization — not authenticated at all", () => {
  it("gets 401, not 403, from GET /api/admin/users", async () => {
    loggedOut();

    const res = await getUsers(listRequest("http://test/api/admin/users"));
    expect(res.status).toBe(401);
  });
});
