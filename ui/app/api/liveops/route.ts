import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { LiveOpsService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const liveOpsService = new LiveOpsService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const dashboard = await liveOpsService.getDashboard(wallet);
      return jsonResponse(dashboard);
    } catch (error) {
      return apiError(error);
    }
  });
};
