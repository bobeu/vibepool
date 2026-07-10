import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { StreakEngine } from "@/services/engines/StreakEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const streakEngine = new StreakEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const streak = await streakEngine.getStreak(wallet);
    return jsonResponse(streak);
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const streak = await streakEngine.updateStreak(wallet);
      return jsonResponse(streak, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
