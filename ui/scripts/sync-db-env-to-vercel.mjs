/**
 * Sync DATABASE_URL / DATABASE_URL_POOLED / DIRECT_URL from ui/.env to Vercel.
 * Uses stdin only (Windows-safe; URLs contain `&` query params).
 * Usage: node scripts/sync-db-env-to-vercel.mjs [production|preview|development]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2] || "production";
const keys = ["DATABASE_URL", "DATABASE_URL_POOLED", "DIRECT_URL"];

function loadEnv(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = value;
  }
  return out;
}

function runVercel(args, input) {
  return spawnSync("vercel", args, {
    cwd: uiRoot,
    input,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
}

const env = loadEnv(path.join(uiRoot, ".env"));

for (const key of keys) {
  const value = env[key]?.trim();
  if (!value || !/^postgres/i.test(value)) {
    console.error(`Missing/invalid ${key} in .env`);
    process.exit(1);
  }
  const host = (value.match(/@([^:/]+)/) || [])[1];
  console.log(`Syncing ${key} (${target}) host=${host} len=${value.length}`);

  runVercel(["env", "rm", key, target, "--yes"]);

  const add = runVercel(["env", "add", key, target, "--sensitive"], `${value}\n`);
  if (add.status !== 0) {
    console.error(add.stdout || "");
    console.error(add.stderr || "");
    console.error(`Failed to add ${key}`);
    process.exit(add.status || 1);
  }
  console.log(`OK ${key}`);
}

console.log("Done. Redeploy required for runtime to pick up new values.");
