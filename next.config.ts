import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Exclude Prisma from bundling (it's a native module)
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-prisma"],
  // Use webpack for better Prisma support
  turbopack: undefined,
  images: {
    remotePatterns: [],
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Prisma from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@prisma/client": false,
        ".prisma/client": false,
      };
    } else {
      // Ensure Prisma client is resolved correctly on server
      // The .prisma/client path needs to resolve from @prisma/client location
      const prismaClientPath = path.resolve(process.cwd(), "node_modules/.prisma/client");
      // Create a proper module resolution for .prisma/client/default
      // The default.js file will require client.ts, and webpack will compile it
      config.resolve.alias = {
        ...config.resolve.alias,
        ".prisma/client": prismaClientPath,
      };
      // Ensure .ts extensions are resolved so default.js can require client.ts
      config.resolve.extensions = [
        ".ts",
        ".tsx",
        ...(config.resolve.extensions || []),
      ];
    }
    return config;
  },
};

export default nextConfig;
