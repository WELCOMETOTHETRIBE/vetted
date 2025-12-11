// Prisma config file - using .js extension to avoid TypeScript module resolution issues
// This file works in both development and production without requiring prisma/config module

// Only import dotenv if available (not needed in production where env vars are set)
try {
  require("dotenv/config");
} catch (e) {
  // dotenv not available - that's fine, environment variables should be set directly
}

// Try to import defineConfig, but fallback gracefully if prisma/config is not available
let defineConfig;
try {
  const prismaConfig = require("prisma/config");
  defineConfig = prismaConfig.defineConfig || prismaConfig.default?.defineConfig;
} catch (e) {
  // prisma/config not available (e.g., in production build)
  // Export a simple config object that Prisma can use
  const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  module.exports = {
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
    },
    datasource: {
      url: databaseUrl,
    },
  };
}

// Only use defineConfig if it was successfully imported and module.exports is empty
if (defineConfig && (!module.exports || Object.keys(module.exports).length === 0)) {
  // DATABASE_URL is only needed at runtime, not during prisma generate
  // Use a placeholder during build if not set to avoid config errors
  const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  module.exports = defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
      path: "prisma/migrations",
    },
    datasource: {
      url: databaseUrl,
    },
  });
}

