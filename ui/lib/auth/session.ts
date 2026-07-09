import { createPublicClient, http, recoverMessageAddress } from "viem";
import { celo } from "wagmi/chains";
import { PrismaClient } from "@prisma/client";

let prismaInstance: PrismaClient | null = null;
export function prisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

const client = createPublicClient({
  chain: celo,
  transport: http(process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org"),
});

export async function verifyWalletSignature(
  wallet: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recovered = await client.readContract({
      address: wallet as `0x${string}`,
      abi: ["function verifyMessage(bytes32, bytes) view returns (bool)"],
      functionName: "verifyMessage",
      args: [message, signature],
    });
    return recovered === wallet;
  } catch {
    return false;
  }
}

export async function createSession(
  prisma: PrismaClient,
  wallet: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateSecureToken(32);
  const refreshToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      wallet,
      refreshToken,
      userAgent: undefined,
      ip: undefined,
      expiresAt,
      status: "ACTIVE",
    },
  });

  await prisma.refreshToken.create({
    data: {
      sessionId: session.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  return { accessToken, refreshToken };
}

export async function refreshSession(
  prisma: PrismaClient,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const token = await prisma.refreshToken.findFirst({
    where: { token: refreshToken, expiresAt: { gt: new Date() }, status: "ACTIVE" },
    include: { session: true },
  });

  if (!token) return null;

  const newAccessToken = generateSecureToken(32);
  const newRefreshToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.session.update({
    where: { id: token.sessionId },
    data: {
      refreshToken: newRefreshToken,
      expiresAt,
    },
  });

  await prisma.refreshToken.update({
    where: { id: token.id },
    data: {
      token: newRefreshToken,
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export function getSessionFromRequest(req: Request): { wallet: string } | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice(7);

  return prisma().session.findFirst({
    where: {
      refreshToken: accessToken,
      expiresAt: { gt: new Date() },
      status: "ACTIVE",
    },
    select: { wallet: true },
  });
}

function generateSecureToken(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
