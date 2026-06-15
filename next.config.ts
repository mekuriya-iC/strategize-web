import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable strict mode to fix Recharts frozen object issues
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
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/graphql",
        destination: "https://strategize-api.frontiertech.org/graphql",
      },
      {
        source: "/api/auth/:path*",
        destination: "https://strategize-api.frontiertech.org/auth/:path*",
      },
      {
        source: "/api/upload",
        destination: "https://strategize-api.frontiertech.org/upload",
      },
      {
        source: "/api/storage/:filename*",
        destination:
          "https://strategize-api.frontiertech.org/storage/:filename*",
      },
    ];
  },
};

export default nextConfig;
