import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { MissionService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const missions = await MissionService.getDailyMissions(wallet);
    return jsonResponse({ missions });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await MissionService.completeMission(wallet, body.missionId as string);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
