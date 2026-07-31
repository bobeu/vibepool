import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/auth/session";

async function conversionStatus(wallet: string) {
  const userId = await resolveUserId(wallet);
  const [cfg, profile] = await Promise.all([
    prisma().spinConfig.findUnique({ where: { key: "default" } }),
    prisma().userProfile.findUnique({
      where: { id: userId },
      select: { xp: true },
    }),
  ]);
  if (!profile) throw new Error("Profile not found");
  const cost = cfg?.xpCostPerSpin && cfg.xpCostPerSpin > 0 ? cfg.xpCostPerSpin : 100;
  return { userId, xp: profile.xp, cost, canConvert: profile.xp >= cost };
}

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const { xp, cost, canConvert } = await conversionStatus(wallet);
      return jsonResponse({ xp, cost, canConvert });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const { userId, xp, cost } = await conversionStatus(wallet);
      if (xp < cost) {
        throw new Error(`Insufficient XP. Need at least ${cost} XP to convert to 1 Spin.`);
      }

      await prisma().$transaction([
        prisma().userProfile.update({
          where: { id: userId },
          data: {
            xp: { decrement: cost },
            spins: { increment: 1 }
          }
        }),
        prisma().spinLedger.create({
          data: {
            userId,
            spinType: "REWARD",
            amount: 1,
            reason: "XP_CONVERTED_SPIN"
          }
        })
      ]);

      return jsonResponse({
        success: true,
        cost,
        message: `Successfully converted ${cost} XP to 1 Spin Ticket!`
      });
    } catch (error) {
      return apiError(error);
    }
  });
};
