/**
 * Locale persistence across registration/login (Part 9 and Part 22 of
 * this feature's spec — "manual choice always wins", "saved account
 * language" priority for a returning user). See
 * tests/locale-detection.test.ts for the pure auto-detection chain and
 * middleware-level cookie-setting; this file covers the two places
 * lib/auth/session.ts's establishSession and app/api/auth/register/
 * route.ts actually touch UserSettings.language / the locale cookie.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { signAccessToken } from "@/lib/auth/jwt";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { PATCH as updatePreferences } from "@/app/api/settings/preferences/route";
import { resetDatabase, seedUserWithWallet } from "./helpers";
import type { User } from "@prisma/client";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

/** Captures every cookie .set() call (not just the last one), so a test
 *  can assert what gtx_locale was actually set to by a given request —
 *  same mock shape referral-system.test.ts uses, with `get` swappable
 *  per test for simulating "no locale cookie yet" vs "cookie already
 *  says X". */
let setCalls: [string, string][] = [];
function mockCookieJar(
  get: (name: string) => { name: string; value: string } | undefined
) {
  setCalls = [];
  vi.mocked(cookies).mockResolvedValue({
    get,
    set: vi.fn((name: string, value: string) => {
      setCalls.push([name, value]);
    }),
    delete: vi.fn(),
  } as never);
}

function lastLocaleCookieSet(): string | undefined {
  return [...setCalls].reverse().find(([name]) => name === LOCALE_COOKIE)?.[1];
}

function loginAs(user: User, existingLocaleCookie?: string) {
  const token = signAccessToken({ sub: user.id, email: user.email });
  mockCookieJar((name) => {
    if (name === ACCESS_COOKIE) return { name, value: token };
    if (name === LOCALE_COOKIE && existingLocaleCookie) {
      return { name, value: existingLocaleCookie };
    }
    return undefined;
  });
}

function jsonReq(
  url: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {}
) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function registerRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return jsonReq("http://test/api/auth/register", "POST", body, headers);
}

function validRegisterBody(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Test",
    lastName: "User",
    email: `loc-${Math.random().toString(36).slice(2)}@test.gtx`,
    password: "Password1",
    agreeToTerms: true,
    ...overrides,
  };
}

beforeEach(async () => {
  await resetDatabase();
  mockCookieJar(() => undefined);
});

afterEach(() => {
  vi.mocked(cookies).mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Registration seeds UserSettings.language from the active request locale", () => {
  it("no locale cookie yet, Accept-Language de-DE -> UserSettings.language is 'de'", async () => {
    mockCookieJar(() => undefined);
    const email = validRegisterBody().email;
    const res = await register(
      registerRequest(validRegisterBody({ email }), {
        "accept-language": "de-DE,de;q=0.9",
      })
    );
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { settings: true },
    });
    expect(user.settings?.language).toBe("de");
  });

  it("an existing locale cookie (set by middleware on an earlier page load) wins over Accept-Language", async () => {
    mockCookieJar((name) => (name === LOCALE_COOKIE ? { name, value: "pl" } : undefined));
    const email = validRegisterBody().email;
    const res = await register(
      registerRequest(validRegisterBody({ email }), {
        "accept-language": "de-DE,de;q=0.9",
      })
    );
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { settings: true },
    });
    expect(user.settings?.language).toBe("pl");
  });

  it("no cookie, no Accept-Language -> falls back to English, not left blank", async () => {
    mockCookieJar(() => undefined);
    const email = validRegisterBody().email;
    await register(registerRequest(validRegisterBody({ email })));

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { settings: true },
    });
    expect(user.settings?.language).toBe("en");
  });
});

describe("Login syncs the locale cookie from the account's saved language", () => {
  it("a returning user's saved 'de' preference overwrites a stale/auto-detected cookie on a new device", async () => {
    // Exercising the real login route needs a real password, so seed the
    // account through the register route rather than seedUserWithWallet
    // (which has no usable password), matching how this actually happens
    // end to end. Their saved language is then set to "de", simulating an
    // earlier manual choice.
    const email = validRegisterBody().email;
    mockCookieJar(() => undefined);
    await register(registerRequest(validRegisterBody({ email })));
    await prisma.userSettings.updateMany({
      where: { user: { email } },
      data: { language: "de" },
    });

    // "New device": Accept-Language auto-detects Spanish, no cookie yet.
    mockCookieJar(() => undefined);
    const res = await login(
      jsonReq(
        "http://test/api/auth/login",
        "POST",
        { email, password: "Password1" },
        { "accept-language": "es-ES,es;q=0.9" }
      )
    );
    expect(res.status).toBe(200);

    // The account's own saved "de" wins over what this new device would
    // have auto-detected.
    expect(lastLocaleCookieSet()).toBe("de");
  });

  it("does not touch the locale cookie when the account has no saved language yet", async () => {
    // A row with no explicit language never happens in practice (see the
    // registration-seeding tests above), but establishSession must still
    // behave safely if settings is entirely absent.
    const user = await seedUserWithWallet(0);
    loginAs(user);
    expect(lastLocaleCookieSet()).toBeUndefined();
  });
});

describe("Part 22 — the full manual-override scenario", () => {
  it("register (auto uk) -> manual English -> logout/login -> still English", async () => {
    mockCookieJar(() => undefined);
    const email = validRegisterBody().email;
    await register(
      registerRequest(validRegisterBody({ email }), {
        "accept-language": "uk-UA,uk;q=0.9",
      })
    );
    const afterRegister = await prisma.user.findUniqueOrThrow({
      where: { email },
      include: { settings: true },
    });
    expect(afterRegister.settings?.language).toBe("uk");

    // User manually switches to English while logged in (locale-context.tsx's
    // setLocale fires this same PATCH).
    const token = signAccessToken({ sub: afterRegister.id, email: afterRegister.email });
    mockCookieJar((name) =>
      name === ACCESS_COOKIE ? { name, value: token } : undefined
    );
    const prefRes = await updatePreferences(
      jsonReq("http://test/api/settings/preferences", "PATCH", { language: "en" })
    );
    expect(prefRes.status).toBe(200);

    // Logout/login again (a fresh session) — the saved "en" must still win,
    // even though this "device" would otherwise auto-detect Ukrainian again.
    mockCookieJar(() => undefined);
    const loginRes = await login(
      jsonReq(
        "http://test/api/auth/login",
        "POST",
        { email, password: "Password1" },
        { "accept-language": "uk-UA,uk;q=0.9" }
      )
    );
    expect(loginRes.status).toBe(200);
    expect(lastLocaleCookieSet()).toBe("en");
  });
});
