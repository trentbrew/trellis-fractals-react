import type { NextConfig } from "next";

const trellisOrigin =
  process.env.TRELLIS_URL ??
  process.env.NEXT_PUBLIC_TRELLIS_URL ??
  "http://localhost:8230";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/grid",
        destination: "/fractals/collection",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // Ontology GET/PATCH are implemented in App Router (trellis@3.2.2 sidecar: POST only).
    return [
      {
        source: "/api/trellis/:path((?!ontologies).*)",
        destination: `${trellisOrigin}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://brew.build https://*.brew.build https://trellis.computer https://*.trellis.computer http://localhost:4321 http://127.0.0.1:4321",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
