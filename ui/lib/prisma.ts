import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function requireDatabaseUrl(): string {
  // Prefer pooled URL on Prisma Postgres; fall back to DATABASE_URL.
  // Dynamic lookup so Next.js does not inline a build-time .env value.
  const connectionString =
    process.env["DATABASE_URL_POOLED"]?.trim() ||
    process.env["DATABASE_URL"]?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_POOLED or DATABASE_URL must be set before creating the Prisma client.",
    );
  }
  return connectionString;
}

/** Shared Prisma Client singleton for server-side code only. */
export const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: requireDatabaseUrl() }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

/** Backward-compatible accessor used across engines as `prisma()`. */
export function prisma(): PrismaClient {
  return prismaClient;
}

export default prismaClient;
