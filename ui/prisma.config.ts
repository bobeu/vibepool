import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  // Migrations need a direct, session-persistent connection. Runtime queries use
  // DATABASE_URL / DATABASE_URL_POOLED via the PrismaPg adapter.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
