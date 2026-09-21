/**
 * Regression coverage for the pre-production audit fix to
 * lib/rate-limit.ts's getClientIp(): it used to trust X-Forwarded-For/
 * X-Real-IP unconditionally, which let any client claim a fresh IP on
 * every request and get a brand new rate-limit bucket each time —
 * trivially defeating login/register/forgot-password/reset-password
 * throttling. It now delegates entirely to lib/security/client-ip.ts's
 * TRUST_PROXY_HEADERS-gated getTrustedClientIp() (see tests/
 * client-ip.test.ts for that gating logic in isolation) and collapses to
 * a single shared "untrusted" key whenever the headers aren't trusted.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

describe("getClientIp (lib/rate-limit.ts) — spoofing resistance", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
  });

  it("TRUST_PROXY_HEADERS unset: a spoofed X-Forwarded-For is ignored, not used as the key", async () => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
    const { getClientIp } = await import("@/lib/rate-limit");
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });
    expect(getClientIp(headers)).toBe("untrusted");
  });

  it("TRUST_PROXY_HEADERS unset: two different claimed IPs collapse to the SAME key", async () => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
    const { getClientIp } = await import("@/lib/rate-limit");
    const a = getClientIp(new Headers({ "x-forwarded-for": "203.0.113.10" }));
    const b = getClientIp(new Headers({ "x-forwarded-for": "198.51.100.42" }));
    expect(a).toBe(b);
  });

  it("TRUST_PROXY_HEADERS=false explicitly: same as unset — spoofed header ignored", async () => {
    process.env.TRUST_PROXY_HEADERS = "false";
    vi.resetModules();
    const { getClientIp } = await import("@/lib/rate-limit");
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });
    expect(getClientIp(headers)).toBe("untrusted");
  });

  it("TRUST_PROXY_HEADERS=true: honors X-Forwarded-For (first hop) as before", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getClientIp } = await import("@/lib/rate-limit");
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 70.41.3.18",
    });
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("end-to-end: rotating a spoofed X-Forwarded-For per request does NOT bypass the rate limit when untrusted", async () => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
    const { getClientIp, rateLimit } = await import("@/lib/rate-limit");

    const limit = 3;
    const results: boolean[] = [];
    for (let i = 0; i < limit + 2; i++) {
      // A different claimed IP on every single request — exactly what an
      // attacker automating this would do.
      const ip = getClientIp(new Headers({ "x-forwarded-for": `198.51.100.${i}` }));
      results.push(rateLimit(`test-login:${ip}`, limit, 60_000).success);
    }

    expect(results.slice(0, limit)).toEqual(Array(limit).fill(true));
    // The (limit+1)th and beyond must be rejected — they all landed in the
    // same "untrusted" bucket despite each claiming a unique IP.
    expect(results.slice(limit)).toEqual([false, false]);
  });

  it("TRUST_PROXY_HEADERS=true: distinct real clients (distinct first-hop IPs) still get independent buckets", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getClientIp, rateLimit } = await import("@/lib/rate-limit");

    const ipA = getClientIp(new Headers({ "x-forwarded-for": "203.0.113.10" }));
    const ipB = getClientIp(new Headers({ "x-forwarded-for": "203.0.113.20" }));
    expect(ipA).not.toBe(ipB);

    const limit = 2;
    for (let i = 0; i < limit; i++) {
      expect(rateLimit(`test-trusted:${ipA}`, limit, 60_000).success).toBe(true);
    }
    // A exhausted its own bucket...
    expect(rateLimit(`test-trusted:${ipA}`, limit, 60_000).success).toBe(false);
    // ...but B, a genuinely different client, is unaffected.
    expect(rateLimit(`test-trusted:${ipB}`, limit, 60_000).success).toBe(true);
  });
});
