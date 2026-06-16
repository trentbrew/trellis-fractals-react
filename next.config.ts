import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.join(__dirname);

const trellisOrigin =
  process.env.TRELLIS_URL ??
  process.env.NEXT_PUBLIC_TRELLIS_URL ??
  "http://localhost:8230";

/** Every ancestor origin must match (nested iframes: trentbrew.com → brew.build → playground). */
const FRAME_ANCESTORS = [
  "'self'",
  "https://brew.build",
  "https://www.brew.build",
  "https://*.brew.build",
  "https://trentbrew.com",
  "https://www.trentbrew.com",
  "https://*.trentbrew.com",
  "https://trellis.computer",
  "https://*.trellis.computer",
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].join(" ");

// The same-origin proxy is a local-dev convenience; in prod the client talks to
// the room node via direct CORS, so the rewrite is dead weight there — and an
// open proxy to the node we don't want exposed publicly. Mirror the provider's
// USE_HTTP_PROXY heuristic.
const useHttpProxy = /localhost|127\.0\.0\.1/.test(trellisOrigin);

const nextConfig: NextConfig = {
  // pnpm + nested desk lockfiles can make Turbopack pick the wrong root ("Next.js package not found").
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      {
        source: "/grid",
        destination: "/fractals/collection",
        permanent: false,
      },
      {
        source: "/realtime",
        destination: "/projections/posts",
        permanent: false,
      },
      {
        source: "/projections",
        destination: "/projections/posts",
        permanent: false,
      },
      {
        source: "/realtime/posts",
        destination: "/projections/posts",
        permanent: false,
      },
      {
        source: "/realtime/chat",
        destination: "/projections/chat",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // Ontology GET/PATCH are implemented in App Router (trellis@3.2.2 sidecar: POST only).
    // Local dev only — see useHttpProxy note above.
    if (!useHttpProxy) return [];
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
            // frame-ancestors (not X-Frame-Options) so the brew.build / trellis.computer
            // blog embeds keep working; object-src/base-uri/form-action close common
            // injection vectors without affecting script/connect/img loading.
            // NOTE: a tighter script-src/connect-src CSP needs a nonce for the inline
            // theme script + the env-specific node/relay origins — tracked as a follow-up.
            key: "Content-Security-Policy",
            value: [
              `frame-ancestors ${FRAME_ANCESTORS}`,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
