import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.APP_URL.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Every authenticated area and the internal API surface — none of
      // it is meaningful to index, and some of it (admin) shouldn't even
      // hint at its existence to crawlers.
      disallow: [
        "/account",
        "/wallet",
        "/deposit",
        "/withdrawal",
        "/history",
        "/settings",
        "/trading",
        "/verification",
        "/admin",
        "/api",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
