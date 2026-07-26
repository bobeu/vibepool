/**
 * Rewrites ui/.env and ui/.env.local from the create-db terminal JSON
 * or from existing DIRECT_URL, normalizing SSL params for Prisma + pg.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const uiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const terminalPath =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || "",
    ".cursor/projects/c-Users-HP-Desktop-proofOfShip-vibepool/terminals/66515.txt",
  );

function stripQuotes(v) {
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

function normalizeUrl(url) {
  const u = new URL(url);
  u.searchParams.set("sslmode", "require");
  u.searchParams.set("uselibpqcompat", "true");
  return u.toString();
}

function readExistingDirect() {
  const envPath = path.join(uiRoot, ".env");
  if (!fs.existsSync(envPath)) return null;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (line.startsWith("DIRECT_URL=")) {
      return stripQuotes(line.slice("DIRECT_URL=".length).trim());
    }
  }
  return null;
}

function readFromTerminal(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/\{[\s\S]*?"success"\s*:\s*true[\s\S]*?\}/);
  if (!match) return null;
  return JSON.parse(match[0]);
}

const fromTerminal = readFromTerminal(terminalPath);
let direct = fromTerminal?.connectionString || readExistingDirect();
const claimUrl = fromTerminal?.claimUrl || null;

if (!direct) {
  console.error("No connection string found.");
  process.exit(1);
}

direct = normalizeUrl(direct);
const pooled = normalizeUrl(direct.replace("@db.prisma.io", "@pooled.db.prisma.io"));

const contents = `NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API=https://forno.celo.org
NEXT_PUBLIC_WALLETCONNECT_ID=444e8c9b1c9d0a1e5f2b2c3d4e5f6a7
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

DATABASE_URL=${pooled}
DATABASE_URL_POOLED=${pooled}
DIRECT_URL=${direct}

BACKEND_SIGNER_PRIVATE_KEY=0xYOUR_BACKEND_SIGNER_PRIVATE_KEY
SESSION_SECRET=nexora-local-dev-session-secret-change-me

NEXT_PUBLIC_REWARD_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_POINTS_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_ACTIVITY_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SPIN_REWARD_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_MINIPAY_CLIENT_ID=YOUR_MINIPAY_CLIENT_ID
`;

fs.writeFileSync(path.join(uiRoot, ".env"), contents, "utf8");
fs.writeFileSync(path.join(uiRoot, ".env.local"), contents, "utf8");
if (claimUrl) {
  fs.writeFileSync(path.join(uiRoot, ".env.prisma.claim"), claimUrl + "\n", "utf8");
}

console.log("Wrote .env and .env.local");
if (claimUrl) console.log("Claim URL saved to .env.prisma.claim");
