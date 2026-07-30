import { NextRequest } from "next/server";
import { prisma, createSession, verifyWalletSignature } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { z } from "zod";

const authSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().startsWith("0x"),
  message: z.string(),
  timestamp: z.number(),
  refCode: z.string().optional(),
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { wallet, signature, message, timestamp, refCode } = authSchema.parse(body);

    const age = Date.now() - timestamp;
    if (age > 5 * 60 * 1000 || age < 0) {
      return apiError(new Error("Auth message expired"));
    }

    const normalizedWallet = wallet.toLowerCase();

    const valid = await verifyWalletSignature(normalizedWallet, signature, message);
    if (!valid) {
      return apiError(new Error("Invalid signature"));
    }

    const existing = await prisma().userProfile.findUnique({ where: { wallet: normalizedWallet } });
    const isNewUser = !existing;

    const user = await prisma().userProfile.upsert({
      where: { wallet: normalizedWallet },
      update: { lastLogin: new Date(), totalActivity: { increment: 1 } },
      create: {
        wallet: normalizedWallet,
        xp: 0,
        points: 0,
        spins: 0,
        level: 0,
        totalActivity: 0,
        status: "ACTIVE",
      },
    });

    if (isNewUser) {
      const { SpinEngine } = await import("@/services/engines/SpinEngine");
      await new SpinEngine().ensureWelcomeSpins(user.id);
    }

    if (isNewUser && refCode) {
      const { InviteService } = await import("@/services/serviceImpl");
      const inviteService = new InviteService();
      try {
        await inviteService.redeem(refCode, normalizedWallet);
      } catch {
        // Invalid or self-referral codes are ignored at login.
      }
    }

    const { accessToken, refreshToken } = await createSession(prisma(), normalizedWallet);

    const { trackBetaEvent } = await import("@/lib/telemetry/betaEvents");
    if (isNewUser) await trackBetaEvent(user.id, "onboarding_complete");

    return jsonResponse({
      accessToken,
      refreshToken,
      wallet: normalizedWallet,
      expiresIn: 15 * 60,
    }, 201);
  } catch (error) {
    return apiError(error);
  }
};
