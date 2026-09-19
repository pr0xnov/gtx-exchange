import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// Public, unauthenticated marketing/entry pages only — never anything
// under (dashboard) or /admin (account, wallet, deposit, withdrawal,
// history, settings, trading, verification all require a session, and
// admin is staff-only). APP_URL is the same env var already used to build
// links in outgoing emails; it's a real domain in production and
// localhost only in dev (see lib/env.ts).
const PUBLIC_PATHS = [
  "",
  "/about",
  "/analytics",
  "/contacts",
  "/privacy",
  "/bonuses",
  "/markets",
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.APP_URL.replace(/\/$/, "");
  return PUBLIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
