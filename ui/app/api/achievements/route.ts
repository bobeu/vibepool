import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { AchievementEngine } from "@/services/engines/AchievementEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const achievementEngine = new AchievementEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const achievements = await achievementEngine.getAchievements(userId);
      return jsonResponse({ achievements });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const result = await achievementEngine.evaluateAchievements(userId);
      return jsonResponse({ evaluated: true, achievements: result }, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
