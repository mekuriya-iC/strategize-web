import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["storage.googleapis.com", "strategize-api.frontiertech.org"],
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
