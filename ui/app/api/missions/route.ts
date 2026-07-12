import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { MissionService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const missionService = new MissionService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const missions = await missionService.getActiveMissions(wallet);
    return jsonResponse({ missions });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const result = await missionService.claimMission(wallet, body.missionId as string);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
