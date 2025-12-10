import type { NextConfig } from "next";
import path from "path";

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
    } else {
      // Ensure Prisma client is resolved correctly on server
      // The .prisma/client path needs to resolve from @prisma/client location
      const prismaClientPath = path.resolve(process.cwd(), "node_modules/.prisma/client");
      config.resolve.alias = {
        ...config.resolve.alias,
        ".prisma/client": prismaClientPath,
        ".prisma/client/default": path.join(prismaClientPath, "client"),
      };
    }
    return config;
  },
};

export default nextConfig;
