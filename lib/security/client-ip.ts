import { createHash } from "node:crypto";
import { isIPv4, isIPv6 } from "node:net";

/**
 * Whether this deployment sits behind a reverse proxy trusted to set
 * X-Forwarded-For/X-Real-IP itself (and strip any client-supplied copy
 * before forwarding). Off by default: gtx-exchange's docker-compose
 * exposes the `web` service directly today, so blindly trusting these
 * headers would let anyone claim to be any IP they like — exactly the
 * header the first-deposit-bonus anti-abuse check relies on to catch
 * bonus farming. Flip this on only once a real reverse proxy (nginx,
 * Cloudflare, a load balancer, ...) is placed in front and configured to
 * overwrite these headers itself rather than pass through a client copy.
 */
const TRUST_PROXY_HEADERS = process.env.TRUST_PROXY_HEADERS === "true";

/**
 * The verified client IP for security-sensitive decisions (currently only
 * the first-deposit-bonus anti-abuse check) — distinct from
 * lib/rate-limit.ts's getClientIp(), which trusts X-Forwarded-For
 * unconditionally because rate-limiting only needs *a* stable-ish key,
 * not a verified one (a spoofed value there just lets an attacker dodge
 * their own limit). Here a spoofed value would instead let a bonus-
 * farming attacker present a fresh IP on every signup, so this returns
 * null — "unknown, don't use this signal" — rather than trust a header
 * nothing has verified as actually coming from a real proxy.
 */
export function getTrustedClientIp(headers: Headers): string | null {
  if (!TRUST_PROXY_HEADERS) return null;
  const forwarded = headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "";
  return normalizeIp(candidate);
}

/**
 * Normalizes a raw IP string for anti-abuse comparison. Returns null for
 * anything that isn't a parseable IP.
 *
 * - IPv4-mapped IPv6 (::ffff:1.2.3.4) collapses to the plain IPv4 form,
 *   so the same connection isn't treated as two different addresses
 *   depending on which stack handled it.
 * - Real IPv6 addresses are bucketed to their /64 network prefix. Privacy-
 *   extension (RFC 4941) hosts — the default on most consumer OSes —
 *   present a different address *suffix* per session or even per day on
 *   the same underlying connection, so comparing full addresses would
 *   almost never catch a repeat visitor; the /64 is the actual unit an
 *   ISP hands a household or device.
 */
export function normalizeIp(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;

  const mapped = value.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  const candidate = mapped ? mapped[1]! : value;

  if (isIPv4(candidate)) return candidate;
  if (isIPv6(candidate)) return `ipv6:${ipv6Prefix64(candidate)}`;
  return null;
}

function ipv6Prefix64(address: string): string {
  const zoneless = address.split("%")[0]!;
  const [head, tail] = zoneless.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const missing = Math.max(8 - headGroups.length - tailGroups.length, 0);
  const groups = [...headGroups, ...Array(missing).fill("0"), ...tailGroups];
  return groups
    .slice(0, 4)
    .map((g) => g.padStart(4, "0"))
    .join(":");
}

/**
 * Non-invasive "device" signal for anti-abuse correlation: a hash of the
 * browser's own volunteered User-Agent header — nothing is probed or
 * collected beyond a header already sent on every request. Deliberately
 * coarse (many devices share a User-Agent string); it exists only to give
 * an admin reviewing a flagged claim extra context ("these two accounts
 * also share the same device"), never to identify a device on its own or
 * to gate the bonus by itself.
 */
export function getDeviceHash(headers: Headers): string | null {
  const ua = headers.get("user-agent")?.trim();
  if (!ua) return null;
  return createHash("sha256").update(ua).digest("hex").slice(0, 32);
}
