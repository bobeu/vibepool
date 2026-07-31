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

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requireDatabaseUrl(),
      // Serverless instances handle few concurrent queries each, so keep pools
      // small and let idle sockets stay warm between invocations.
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    }),
  });
}

/**
 * Shared Prisma Client singleton for server-side code only.
 * Cached on globalThis in every environment so route handlers that land in
 * separate bundles reuse one connection pool instead of opening one each.
 */
export const prismaClient = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prismaClient;

/** Backward-compatible accessor used across engines as `prisma()`. */
export function prisma(): PrismaClient {
  return prismaClient;
}

export default prismaClient;
