import type { NextConfig } from "next";

const trellisOrigin = process.env.TRELLIS_URL ?? "http://localhost:8230";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/trellis/:path*",
        destination: `${trellisOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
