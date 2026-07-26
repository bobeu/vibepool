import fs from "fs";
import pg from "pg";

const env = fs.readFileSync(".env", "utf8");
for (const line of env.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const key = line.slice(0, i).trim();
  let value = line.slice(i + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

for (const key of ["DIRECT_URL", "DATABASE_URL", "DATABASE_URL_POOLED"]) {
  const cs = process.env[key];
  if (!cs) {
    console.log(key, "missing");
    continue;
  }
  const host = (cs.match(/@([^:/]+)/) || [])[1];
  console.log(key, "len=" + cs.length, "host=" + host);

  const client = new pg.Client({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  try {
    await client.connect();
    const r = await client.query("select 1 as ok");
    console.log(key, "CONNECT_OK", r.rows[0]);
    await client.end();
  } catch (e) {
    console.log(key, "CONNECT_FAIL", e.code || "", String(e.message).split("\n")[0]);
  }
}
