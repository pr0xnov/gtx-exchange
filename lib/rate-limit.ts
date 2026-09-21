import { getTrustedClientIp } from "@/lib/security/client-ip";

/**
 * Lightweight in-memory rate limiter (sliding window) for API routes.
 * For multi-instance production deployments, back this with Redis instead —
 * the interface (check()) stays the same either way.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

/** The single source of truth for "the client's IP" used everywhere in
 *  this app (rate-limit bucket keys and audit-log ipAddress fields alike)
 *  — delegates entirely to lib/security/client-ip.ts's
 *  getTrustedClientIp(), which only trusts X-Forwarded-For/X-Real-IP when
 *  TRUST_PROXY_HEADERS=true (a real reverse proxy is confirmed to be
 *  overwriting those headers itself, not merely passing a client-supplied
 *  copy through). There used to be a second, unconditional implementation
 *  right here that trusted these headers regardless — with gtx-exchange's
 *  docker-compose.yml exposing `web` directly by default, that let any
 *  client claim to be any IP and get a fresh rate-limit bucket on demand,
 *  trivially defeating login/register/forgot-password throttling by
 *  sending a different X-Forwarded-For on every request.
 *
 *  When untrusted (the default), every caller collapses onto the same
 *  "untrusted" key instead of guessing — a shared, stricter limit for all
 *  unverified traffic is the safe failure mode here, not a per-claimed-IP
 *  limit an attacker can reset at will. Once a real reverse proxy is in
 *  front and TRUST_PROXY_HEADERS=true, this again resolves to the real
 *  per-client IP and rate limiting (and audit logs) regain their normal
 *  granularity. */
export function getClientIp(headers: Headers): string {
  return getTrustedClientIp(headers) ?? "untrusted";
}

// Periodically clean up expired buckets so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();
