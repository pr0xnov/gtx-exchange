import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "assets.coincap.io" },
      { protocol: "https", hostname: "s2.coinmarketcap.com" },
    ],
  },
  async headers() {
    return [
      {
        // Previously /api/:path* only — page routes got zero security
        // headers at all. A bare CSP is deliberately NOT included here:
        // getting it right (inline hydration scripts, the WS connection,
        // coincap/coinmarketcap image hosts, fonts) needs its own
        // dedicated pass with real page-by-page verification, not a
        // guess bundled into an unrelated audit — a wrong CSP fails
        // silent-and-broken, which is worse than the current gap. HSTS
        // is also deliberately absent — this deployment has no real
        // HTTPS/reverse-proxy in front yet (see lib/security/geo.ts and
        // client-ip.ts's own TRUST_PROXY_HEADERS gate for the same
        // reasoning) and enabling it prematurely on plain HTTP is unsafe.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The old user-facing /support page (contact form + outdated FAQ)
      // was removed in favor of /contacts, which already has the real
      // support experience (online chat, Telegram, current FAQ). Never
      // /admin/support or /api/support/** — those are unrelated routes
      // that happen to share the "support" word, not aliases of this one.
      { source: "/support", destination: "/contacts", permanent: false },
    ];
  },
  output: "standalone",
};

export default nextConfig;
