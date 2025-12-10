import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Exclude Prisma from bundling (it's a native module)
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-prisma"],
  // Use webpack for better Prisma support
  turbopack: undefined,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Prisma from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@prisma/client": false,
        ".prisma/client": false,
      };
    }
    return config;
  },
};

export default nextConfig;
