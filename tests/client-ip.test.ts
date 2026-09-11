/**
 * lib/security/client-ip.ts — the trusted-proxy-gated IP capture and
 * normalization used exclusively by the first-deposit-bonus anti-abuse
 * check (tests/first-deposit-bonus-anti-abuse.test.ts covers the bonus
 * behavior itself; this file covers the parsing/normalization logic in
 * isolation).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeIp, getDeviceHash } from "@/lib/security/client-ip";

describe("normalizeIp", () => {
  it("returns a valid IPv4 address unchanged", () => {
    expect(normalizeIp("203.0.113.10")).toBe("203.0.113.10");
  });

  it("trims and lowercases before validating", () => {
    expect(normalizeIp("  203.0.113.10  ")).toBe("203.0.113.10");
  });

  it("collapses an IPv4-mapped IPv6 address to its plain IPv4 form", () => {
    expect(normalizeIp("::ffff:203.0.113.10")).toBe("203.0.113.10");
  });

  it("buckets a real IPv6 address to its /64 network prefix", () => {
    expect(normalizeIp("2001:db8:1234:5678:aaaa:bbbb:cccc:0001")).toBe(
      "ipv6:2001:0db8:1234:5678"
    );
  });

  it("two different addresses in the same /64 normalize identically", () => {
    const a = normalizeIp("2001:db8:1234:5678:aaaa:bbbb:cccc:0001");
    const b = normalizeIp("2001:db8:1234:5678:ffff:eeee:dddd:0002");
    expect(a).toBe(b);
  });

  it("addresses in different /64 prefixes normalize differently", () => {
    const a = normalizeIp("2001:db8:1111:0000:aaaa:bbbb:cccc:0001");
    const b = normalizeIp("2001:db8:2222:0000:aaaa:bbbb:cccc:0001");
    expect(a).not.toBe(b);
  });

  it("handles compressed IPv6 loopback (::1)", () => {
    expect(normalizeIp("::1")).toBe("ipv6:0000:0000:0000:0000");
  });

  it("handles a fully-expanded IPv6 address with no :: compression", () => {
    expect(normalizeIp("2001:0db8:0000:0042:0000:0000:0000:0001")).toBe(
      "ipv6:2001:0db8:0000:0042"
    );
  });

  it("returns null for garbage input", () => {
    expect(normalizeIp("not-an-ip")).toBeNull();
    expect(normalizeIp("999.999.999.999")).toBeNull();
  });

  it("returns null for an empty or whitespace-only string", () => {
    expect(normalizeIp("")).toBeNull();
    expect(normalizeIp("   ")).toBeNull();
  });
});

describe("getDeviceHash", () => {
  it("returns a stable hash for the same User-Agent", () => {
    const headers = new Headers({ "user-agent": "Mozilla/5.0 Test" });
    expect(getDeviceHash(headers)).toBe(getDeviceHash(headers));
  });

  it("returns different hashes for different User-Agent strings", () => {
    const a = getDeviceHash(new Headers({ "user-agent": "Mozilla/5.0 Test A" }));
    const b = getDeviceHash(new Headers({ "user-agent": "Mozilla/5.0 Test B" }));
    expect(a).not.toBe(b);
  });

  it("returns null when no User-Agent header is present", () => {
    expect(getDeviceHash(new Headers())).toBeNull();
  });

  it("never returns the raw User-Agent string itself", () => {
    const ua = "Mozilla/5.0 Test";
    const hash = getDeviceHash(new Headers({ "user-agent": ua }));
    expect(hash).not.toBe(ua);
    expect(hash).not.toContain("Mozilla");
  });
});

describe("getTrustedClientIp — trusted-proxy gating", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
  });

  it("returns null when TRUST_PROXY_HEADERS is not enabled, even with a valid X-Forwarded-For", async () => {
    delete process.env.TRUST_PROXY_HEADERS;
    vi.resetModules();
    const { getTrustedClientIp } = await import("@/lib/security/client-ip");
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });
    expect(getTrustedClientIp(headers)).toBeNull();
  });

  it("honors X-Forwarded-For (first hop) once TRUST_PROXY_HEADERS is enabled", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getTrustedClientIp } = await import("@/lib/security/client-ip");
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 70.41.3.18, 150.172.238.178",
    });
    expect(getTrustedClientIp(headers)).toBe("203.0.113.10");
  });

  it("falls back to X-Real-IP when trusted and no X-Forwarded-For is present", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getTrustedClientIp } = await import("@/lib/security/client-ip");
    const headers = new Headers({ "x-real-ip": "203.0.113.10" });
    expect(getTrustedClientIp(headers)).toBe("203.0.113.10");
  });

  it("returns null when trusted but no usable IP header is present at all", async () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    vi.resetModules();
    const { getTrustedClientIp } = await import("@/lib/security/client-ip");
    expect(getTrustedClientIp(new Headers())).toBeNull();
  });
});
