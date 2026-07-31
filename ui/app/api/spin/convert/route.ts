import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { prisma } from "@/lib/auth/session";

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const cfg = await prisma().spinConfig.findUnique({ where: { key: "default" } });
      const cost = cfg?.xpCostPerSpin && cfg.xpCostPerSpin > 0 ? cfg.xpCostPerSpin : 100;

      const profile = await prisma().userProfile.findUnique({ where: { id: userId } });
      if (!profile) throw new Error("Profile not found");

      if (profile.xp < cost) {
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
