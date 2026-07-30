import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

const hasDirectUrl = Boolean(process.env.DIRECT_URL?.trim());
const requireMigrate = process.env.REQUIRE_PRISMA_MIGRATE === "1";
const skipMigrate = process.env.SKIP_PRISMA_MIGRATE === "1";

if (!skipMigrate && hasDirectUrl) {
  try {
    console.log("[build] Running prisma migrate deploy via DIRECT_URL…");
    execSync("bunx prisma migrate deploy", {
      stdio: "inherit",
      timeout: 60_000,
      env: process.env,
    });
    console.log("[build] Prisma migrations applied.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      "[build] prisma migrate deploy failed:",
      message,
      "\n[build] This often happens when Vercel build machines cannot reach the direct",
      "Postgres port (db.prisma.io:5432). Deploy continues; run migrations manually:",
      "cd ui && bunx prisma migrate deploy",
    );
    if (requireMigrate) {
      process.exit(1);
    }
  }
} else if (!hasDirectUrl) {
  console.warn("[build] DIRECT_URL is not set — skipping prisma migrate deploy.");
} else {
  console.log("[build] SKIP_PRISMA_MIGRATE=1 — skipping prisma migrate deploy.");
}

run("bun run next build");
