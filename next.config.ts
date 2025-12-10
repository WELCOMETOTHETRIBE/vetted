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
      // Create a proper module resolution for .prisma/client/default
      config.resolve.alias = {
        ...config.resolve.alias,
        ".prisma/client": prismaClientPath,
        ".prisma/client/default": path.join(prismaClientPath, "client.ts"),
      };
      // Next.js already handles TypeScript files, so we just need to ensure
      // the alias points to the TypeScript file and webpack will compile it
    }
    return config;
  },
};

export default nextConfig;
