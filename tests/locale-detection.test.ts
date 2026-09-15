/**
 * The 8-language auto-detection chain: Accept-Language match, then
 * trusted-country fallback (gated behind TRUST_PROXY_HEADERS — see
 * lib/security/geo.ts's own doc comment on why this self-hosted Docker
 * Compose deployment can't trust a country header by default), then
 * English. Covers the pure-function priority chain (Accept-Language
 * mapping, country fallback, the full resolveAutoLocale chain),
 * middleware()'s first-visit cookie-setting (including the "never
 * overwrites an existing cookie" manual-override guarantee and the
 * TRUST_PROXY_HEADERS=true + country case), lib/security/geo.ts's own
 * gating in isolation (matching tests/client-ip.test.ts's env-flag-reset
 * pattern for the same underlying trust boundary), and
 * establishSession()'s login-time "saved account language" cookie sync.
 * tests/middleware.test.ts covers unrelated route-protection behavior
 * (redirects for /wallet etc.) — no overlap with this file.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  LOCALES,
  resolveLocaleFromAcceptLanguage,
  resolveLocaleFromCountry,
  resolveAutoLocale,
  isLocale,
  localeName,
  localeLabel,
} from "@/lib/i18n/config";
import { prisma } from "@/lib/db";
import { establishSession } from "@/lib/auth/session";
import { resetDatabase, seedUserWithWallet } from "./helpers";

describe("All 8 locales are registered", () => {
  it("LOCALES contains exactly uk/ru/en/es/pt/tr/de/pl", () => {
    expect([...LOCALES].sort()).toEqual(
      ["de", "en", "es", "pl", "pt", "ru", "tr", "uk"].sort()
    );
  });

  it("every locale has a short label and a native name", () => {
    for (const l of LOCALES) {
      expect(localeLabel(l)).toBeTruthy();
      expect(localeName(l)).toBeTruthy();
    }
  });
});

describe("Accept-Language detection (Part 20 of this feature's spec)", () => {
  const cases: [string, string | null][] = [
    ["uk-UA,uk;q=0.9", "uk"],
    ["ru-RU,ru;q=0.9", "ru"],
    ["en-US,en;q=0.9", "en"],
    ["es-ES,es;q=0.9", "es"],
    ["pt-PT,pt;q=0.9", "pt"],
    ["pt-BR,pt;q=0.9", "pt"],
    ["tr-TR,tr;q=0.9", "tr"],
    ["de-DE,de;q=0.9", "de"],
    ["pl-PL,pl;q=0.9", "pl"],
    ["fr-FR,fr;q=0.9", null], // unsupported — no match at all
  ];

  for (const [header, expected] of cases) {
    it(`"${header}" -> ${expected ?? "no match"}`, () => {
      expect(resolveLocaleFromAcceptLanguage(header)).toBe(expected);
    });
  }

  it("null header -> no match", () => {
    expect(resolveLocaleFromAcceptLanguage(null)).toBeNull();
  });

  it("an unsupported primary language falls through to a later supported one in the same header", () => {
    expect(resolveLocaleFromAcceptLanguage("fr-FR,fr;q=0.9,de;q=0.5")).toBe("de");
  });
});

describe("Country fallback (Part 21 of this feature's spec)", () => {
  const cases: [string, string][] = [
    ["UA", "uk"],
    ["RU", "ru"],
    ["ES", "es"],
    ["PT", "pt"],
    ["BR", "pt"],
    ["TR", "tr"],
    ["DE", "de"],
    ["AT", "de"],
    ["PL", "pl"],
  ];

  for (const [country, expected] of cases) {
    it(`${country} -> ${expected}`, () => {
      expect(resolveLocaleFromCountry(country)).toBe(expected);
    });
  }

  it("lowercase country codes still match", () => {
    expect(resolveLocaleFromCountry("ua")).toBe("uk");
  });

  it("an unmapped country returns null (caller falls back to English)", () => {
    expect(resolveLocaleFromCountry("JP")).toBeNull();
  });

  it("null/empty country returns null", () => {
    expect(resolveLocaleFromCountry(null)).toBeNull();
    expect(resolveLocaleFromCountry("")).toBeNull();
  });
});

describe("resolveAutoLocale — the full chain, Accept-Language before country before English", () => {
  it("unsupported Accept-Language + a mapped country -> the country's locale", () => {
    expect(resolveAutoLocale({ acceptLanguage: "fr-FR", country: "DE" })).toBe("de");
  });

  it("unsupported Accept-Language + an unmapped country -> English", () => {
    expect(resolveAutoLocale({ acceptLanguage: "fr-FR", country: "JP" })).toBe("en");
  });

  it("no Accept-Language, no country -> English", () => {
    expect(resolveAutoLocale({ acceptLanguage: null, country: null })).toBe("en");
  });

  it("a supported Accept-Language wins even when country would suggest something else", () => {
    expect(resolveAutoLocale({ acceptLanguage: "de-DE", country: "PL" })).toBe("de");
  });
});

describe("isLocale", () => {
  it("accepts all 8 supported codes", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
  });

  it("rejects an unsupported code", () => {
    expect(isLocale("fr")).toBe(false);
  });
});

describe("middleware — locale auto-detection only fires when no cookie exists yet", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
  });

  function requestWithHeaders(headers: Record<string, string>) {
    return new NextRequest("http://localhost:3000/", { headers });
  }

  it("sets the locale cookie from Accept-Language on a first visit (no cookie yet)", async () => {
    const { middleware } = await import("@/middleware");
    const req = requestWithHeaders({ "accept-language": "de-DE,de;q=0.9" });
    const res = middleware(req);
    expect(res.cookies.get("gtx_locale")?.value).toBe("de");
  });

  it("falls back to English when Accept-Language is unsupported and no country is available", async () => {
    const { middleware } = await import("@/middleware");
    const req = requestWithHeaders({ "accept-language": "fr-FR" });
    const res = middleware(req);
    expect(res.cookies.get("gtx_locale")?.value).toBe("en");
  });

  it("never overwrites an existing locale cookie, even with a conflicting Accept-Language — manual choice always wins", async () => {
    const { middleware } = await import("@/middleware");
    const req = new NextRequest("http://localhost:3000/trading", {
      headers: { "accept-language": "uk-UA,uk;q=0.9" },
    });
    req.cookies.set("gtx_locale", "en"); // simulates a prior manual choice
    const res = middleware(req);
    // No new Set-Cookie for gtx_locale — the response never touches it.
    expect(res.cookies.get("gtx_locale")).toBeUndefined();
  });

  it("ignores a client-supplied country header by default (TRUST_PROXY_HEADERS unset)", async () => {
    const { middleware } = await import("@/middleware");
    const req = requestWithHeaders({
      "accept-language": "fr-FR",
      "cf-ipcountry": "DE", // would resolve to "de" if ever trusted
    });
    const res = middleware(req);
    // Untrusted deployment (this app's real docker-compose setup has no
    // reverse proxy in front) — the header must be ignored, falling all
    // the way through to English, not "de".
    expect(res.cookies.get("gtx_locale")?.value).toBe("en");
  });

  it("honors a trusted country header once TRUST_PROXY_HEADERS is enabled", async () => {
    // lib/security/geo.ts reads TRUST_PROXY_HEADERS into a module-level
    // constant at import time (same pattern as lib/security/client-ip.ts)
    // — needs a fresh module graph after flipping the env var.
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { middleware } = await import("@/middleware");
    const req = requestWithHeaders({ "accept-language": "fr-FR", "cf-ipcountry": "PL" });
    const res = middleware(req);
    expect(res.cookies.get("gtx_locale")?.value).toBe("pl");
  });
});

describe("lib/security/geo.ts — getTrustedCountry gating (mirrors client-ip.test.ts's own pattern)", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
  });

  it("returns null when TRUST_PROXY_HEADERS is not enabled, even with a valid country header present", async () => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
    const { getTrustedCountry } = await import("@/lib/security/geo");
    const headers = new Headers({ "cf-ipcountry": "DE" });
    expect(getTrustedCountry(headers)).toBeNull();
  });

  it("honors cf-ipcountry once TRUST_PROXY_HEADERS is enabled", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getTrustedCountry } = await import("@/lib/security/geo");
    const headers = new Headers({ "cf-ipcountry": "PL" });
    expect(getTrustedCountry(headers)).toBe("PL");
  });

  it("falls back through x-vercel-ip-country and cloudfront-viewer-country when trusted", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getTrustedCountry } = await import("@/lib/security/geo");
    expect(getTrustedCountry(new Headers({ "x-vercel-ip-country": "TR" }))).toBe("TR");
    expect(getTrustedCountry(new Headers({ "cloudfront-viewer-country": "ES" }))).toBe(
      "ES"
    );
  });

  it("returns null when trusted but no country header is present at all", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getTrustedCountry } = await import("@/lib/security/geo");
    expect(getTrustedCountry(new Headers())).toBeNull();
  });
});

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

/**
 * establishSession()'s "saved account language" sync (Part 9 of this
 * feature's spec: for an authenticated user, priority is saved account
 * language -> manual locale cookie -> automatic detection). Exercises
 * the real function against a real DB-backed UserSettings row — only
 * next/headers's cookies() is mocked, same pattern as
 * tests/admin-authorization.test.ts.
 */
describe("establishSession — syncs the locale cookie from UserSettings.language", () => {
  let setCookie: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await resetDatabase();
    setCookie = vi.fn();
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
      set: setCookie,
      delete: vi.fn(),
    } as never);
  });

  afterEach(() => {
    vi.mocked(cookies).mockReset();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sets the locale cookie to the user's saved language on login", async () => {
    const user = await seedUserWithWallet(0);
    await prisma.userSettings.create({ data: { userId: user.id, language: "de" } });

    await establishSession({
      id: user.id,
      email: user.email,
      settings: { language: "de" },
    });

    const localeCall = setCookie.mock.calls.find(([name]) => name === "gtx_locale");
    expect(localeCall?.[1]).toBe("de");
  });

  it("never sets the locale cookie when no settings/language is known (e.g. a fresh row without one)", async () => {
    const user = await seedUserWithWallet(0);

    await establishSession({ id: user.id, email: user.email, settings: null });

    const localeCall = setCookie.mock.calls.find(([name]) => name === "gtx_locale");
    expect(localeCall).toBeUndefined();
  });

  it("falls back to English if the saved language is somehow unsupported", async () => {
    const user = await seedUserWithWallet(0);

    await establishSession({
      id: user.id,
      email: user.email,
      settings: { language: "fr" },
    });

    const localeCall = setCookie.mock.calls.find(([name]) => name === "gtx_locale");
    expect(localeCall?.[1]).toBe("en");
  });
});
