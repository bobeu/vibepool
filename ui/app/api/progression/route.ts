import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ProgressionService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const progressionService = new ProgressionService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const url = new URL(req.url);
    const section = url.searchParams.get("section") || "overview";

    let data: Record<string, unknown> = {};

    switch (section) {
      case "level":
        data = await progressionService.getLevelProgress(wallet);
        break;
      case "rank":
        data = await progressionService.getPlayerRank(wallet);
        break;
      case "engagement":
        data = await progressionService.getEngagementMetrics(wallet);
        break;
      default:
        const [level, rank, engagement] = await Promise.all([
          progressionService.getLevelProgress(wallet),
          progressionService.getPlayerRank(wallet),
          progressionService.getEngagementMetrics(wallet),
        ]);
        data = { level, rank, engagement };
    }

    return jsonResponse(data);
  });
};
