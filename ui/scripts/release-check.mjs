#!/usr/bin/env node
/**
 * Pre-release validation — runs existing tooling, no new dependencies.
 * Usage: bun run release:check
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const requiredEnv = [
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_WALLETCONNECT_ID",
];

const optionalEnv = [
  "SUPER_ADMIN_WALLETS",
  "ADMIN_WALLETS",
  "BACKEND_SIGNER_PRIVATE_KEY",
  "NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API",
  "APP_VERSION",
];

function run(label, cmd, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: true });
  if (result.status !== 0) {
    console.error(`✗ ${label} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

console.log("NEXORA Release Check — Prompt 18\n");

console.log("Environment variables:");
for (const key of requiredEnv) {
  const ok = Boolean(process.env[key]);
  console.log(`  ${ok ? "✓" : "✗"} ${key}${ok ? "" : " (required for staging/prod)"}`);
}
for (const key of optionalEnv) {
  const ok = Boolean(process.env[key]);
  console.log(`  ${ok ? "✓" : "○"} ${key} (optional)`);
}

const addressesPath = join(root, "lib/contracts/addresses.json");
console.log(`\nContracts: ${existsSync(addressesPath) ? "✓ addresses.json" : "✗ missing"}`);

run("Prisma generate", "bun", ["run", "db:generate"]);
run("Integration tests", "bun", ["run", "test", "__tests__/integration.test.ts"]);
run("Production build", "bun", ["run", "build"]);

console.log("\n✓ Release check complete. Run smoke tests after deploy:");
console.log("  bun run start");
console.log("  PLAYWRIGHT_SKIP_WEBSERVER=1 bun run test:e2e");
