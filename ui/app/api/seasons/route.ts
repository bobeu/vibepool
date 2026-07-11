import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { SeasonService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const seasonService = new SeasonService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async (wallet) => {
    try {
      const active = await seasonService.getActiveSeason();
      const progress = wallet ? await seasonService.getProgress(wallet) : null;
      return jsonResponse({ active, progress });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      const action = body.action as string | undefined;

      if (action === "activate") {
        const season = await seasonService.activateSeason(wallet, body.seasonId as string);
        return jsonResponse(season);
      }

      const season = await seasonService.createSeason(wallet, body);
      return jsonResponse(season, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
