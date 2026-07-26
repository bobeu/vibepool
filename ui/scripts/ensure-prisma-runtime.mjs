/**
 * Bun sometimes installs @prisma/client without runtime *.d.ts files that
 * `prisma generate` tries to copy. Create minimal stubs so generate succeeds.
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "node_modules", "@prisma", "client");
const runtime = join(root, "runtime");

if (!existsSync(root)) {
  console.warn("[ensure-prisma-runtime] @prisma/client not installed yet");
  process.exit(0);
}

mkdirSync(runtime, { recursive: true });

const stubs = [
  join(runtime, "client.d.ts"),
  join(runtime, "index-browser.d.ts"),
  join(runtime, "wasm-compiler-edge.d.ts"),
  join(root, "default.d.ts"),
  join(root, "index.d.ts"),
  join(root, "edge.d.ts"),
  join(root, "extension.d.ts"),
  join(root, "sql.d.ts"),
];

for (const file of stubs) {
  if (!existsSync(file)) {
    writeFileSync(file, "export {};\n", "utf8");
  }
}
