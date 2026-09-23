import type { NextConfig } from "next";
import path from "path";

const apiBase =
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3000"
    : "https://strategize-api.frontiertech.org");

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable strict mode to fix Recharts frozen object issues
  // Keep Turbopack rooted on this app so a parent ~/pnpm-lock.yaml cannot
  // pull in a second React copy (causes FiberNode.lanes read-only crashes).
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "strategize-api.frontiertech.org",
      },
      {
        protocol: "https",
        hostname: "storage.shofer.et",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/graphql",
        destination: `${apiBase}/graphql`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${apiBase}/auth/:path*`,
      },
      {
        source: "/api/upload",
        destination: `${apiBase}/upload`,
      },
      // `/api/storage/*` is handled by `src/app/api/storage/[...path]/route.ts`
      // so JWT from the request/cookie can be forwarded to the API.
    ];
  },
};

export default nextConfig;
