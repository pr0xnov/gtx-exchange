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
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
