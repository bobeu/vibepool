import { recoverMessageAddress } from "viem";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export { prisma, prismaClient } from "@/lib/prisma";

export async function verifyWalletSignature(
  wallet: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    return recovered.toLowerCase() === wallet.toLowerCase();
  } catch {
    return false;
  }
}

export async function createSession(
  db: PrismaClient,
  wallet: string,
  meta?: { userAgent?: string; ip?: string; userId?: string }
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
  const normalized = wallet.toLowerCase();
  // Callers that just created the profile pass userId to skip a round trip.
  let userId = meta?.userId;
  if (!userId) {
    const user = await db.userProfile.findUnique({
      where: { wallet: normalized },
      select: { id: true },
    });
    if (!user) throw new Error("User not found");
    userId = user.id;
  }

  const token = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      wallet: normalized,
      refreshToken: token,
      expiresAt,
      revoked: false,
      userAgent: meta?.userAgent,
      ip: meta?.ip,
      tokenRecord: {
        create: {
          token,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          revoked: false,
        },
      },
    },
    select: { id: true },
  });

  return { accessToken: token, refreshToken: token, expiresAt };
}

export async function refreshSession(
  db: PrismaClient,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const row = await db.refreshToken.findFirst({
    where: { token: refreshToken, revoked: false, expiresAt: { gt: new Date() } },
    include: { session: true },
  });

  if (!row || row.session.revoked) return null;

  const newToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.session.update({
    where: { id: row.sessionId },
    data: { refreshToken: newToken, expiresAt, revoked: false },
  });

  await db.refreshToken.update({
    where: { id: row.id },
    data: { token: newToken, replacedBy: refreshToken },
  });

  return { accessToken: newToken, refreshToken: newToken };
}

export async function getSessionFromRequest(
  req: Request
): Promise<{ wallet: string; userId: string; expiresAt: Date } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const session = await prisma().session.findFirst({
    where: {
      refreshToken: token,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    select: { wallet: true, userId: true, expiresAt: true },
  });

  return session;
}

export async function revokeSession(token: string): Promise<boolean> {
  const session = await prisma().session.findFirst({
    where: { refreshToken: token, revoked: false },
  });
  if (!session) return false;

  await prisma().session.update({
    where: { id: session.id },
    data: { revoked: true },
  });

  await prisma().refreshToken.updateMany({
    where: { sessionId: session.id },
    data: { revoked: true },
  });

  return true;
}

function generateSecureToken(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
