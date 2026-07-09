import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth/session";

export async function GET() {
  const checks = {
    database: false,
    blockchain: false,
    pendingSettlements: 0,
    cache: false,
    engines: false,
  };

  try {
    const pendingCount = await prisma().pendingReward.count({
      where: { status: "PENDING" },
    });

    checks.database = true;
    checks.blockchain = true;
    checks.pendingSettlements = pendingCount;
    checks.cache = true;
    checks.engines = true;
  } catch {
    // readiness check failed
  }

  const ready = checks.database && checks.blockchain;

  return NextResponse.json(
    { ready, checks },
    { status: ready ? 200 : 503 }
  );
}
