import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/auth/session";
import type { AdminRole } from "./permissions";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function buildDeviceFingerprint(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? "";
  const accept = req.headers.get("accept-language") ?? "";
  return createHash("sha256").update(`${ua}|${accept}`).digest("hex").slice(0, 32);
}

function computeRiskScore(params: {
  ipAddress: string;
  ipHistory: string[];
  concurrentSessions: number;
  deviceFingerprint?: string | null;
}): number {
  let score = 0;
  if (params.ipAddress === "unknown") score += 20;
  if (params.concurrentSessions > 2) score += 30;
  if (params.ipHistory.length > 3) score += 15;
  const uniqueIps = new Set(params.ipHistory).size;
  if (uniqueIps > 2) score += 20;
  return Math.min(100, score);
}

export async function trackAdminSession(wallet: string, role: AdminRole, req: NextRequest): Promise<void> {
  const ipAddress = clientIp(req);
  const deviceFingerprint = buildDeviceFingerprint(req);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  const existing = token
    ? await prisma().adminSession.findUnique({ where: { token } })
    : null;

  const concurrent = await prisma().adminSession.count({
    where: { wallet: wallet.toLowerCase(), revoked: false, expiresAt: { gt: new Date() } },
  });

  const ipHistory: string[] = existing?.ipHistory ? (existing.ipHistory as string[]) : [];
  if (!ipHistory.includes(ipAddress)) ipHistory.push(ipAddress);

  const riskScore = computeRiskScore({ ipAddress, ipHistory, concurrentSessions: concurrent, deviceFingerprint });

  if (existing) {
    await prisma().adminSession.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date(), ipAddress, ipHistory, deviceFingerprint, riskScore },
    });
    return;
  }

  if (!token) return;

  await prisma().adminSession.create({
    data: {
      wallet: wallet.toLowerCase(),
      role,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      deviceFingerprint,
      ipAddress,
      ipHistory,
      riskScore,
    },
  });
}

export async function getSessionIntelligence(wallet: string): Promise<Record<string, unknown>> {
  const sessions = await prisma().adminSession.findMany({
    where: { wallet: wallet.toLowerCase() },
    orderBy: { lastSeenAt: "desc" },
    take: 20,
  });

  const active = sessions.filter((s) => !s.revoked && s.expiresAt > new Date());
  const fingerprints = new Set(sessions.map((s) => s.deviceFingerprint).filter(Boolean));

  return {
    wallet,
    activeSessions: active.length,
    concurrentDetected: active.length > 1,
    maxRiskScore: Math.max(0, ...sessions.map((s) => s.riskScore)),
    uniqueDevices: fingerprints.size,
    sessions: sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      deviceFingerprint: s.deviceFingerprint,
      riskScore: s.riskScore,
      lastSeenAt: s.lastSeenAt,
      revoked: s.revoked,
    })),
  };
}
