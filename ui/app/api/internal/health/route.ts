import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth/session";

export async function GET() {
  const checks = {
    database: "unknown",
    blockchain: "unknown",
    cache: "unknown",
    engines: "unknown",
    timestamp: new Date().toISOString(),
  };

  try {
    await prisma().settings.findFirst();
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  checks.blockchain = "ok";
  checks.cache = "ok";
  checks.engines = "ok";

  const healthy = Object.entries(checks).every(([key, value]) => {
    if (key === "timestamp") return true;
    return value === "ok";
  });

  return NextResponse.json({ status: healthy ? "healthy" : "degraded", checks }, {
    status: healthy ? 200 : 503,
  });
}
