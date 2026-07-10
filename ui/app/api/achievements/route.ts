import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { AchievementEngine } from "@/services/engines/AchievementEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const achievementEngine = new AchievementEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const achievements = await achievementEngine.getAchievements(wallet);
    return jsonResponse({ achievements });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      const result = await achievementEngine.evaluateAchievements(wallet);
      return jsonResponse({ evaluated: true, achievements: result }, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
