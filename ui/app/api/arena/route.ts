import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const home = await arenaService.getHome(wallet);
      const queue = await arenaService.getQueueStatus(wallet);
      const live = await arenaService.getLiveMatches(10);
      return jsonResponse({ ...home, queue, live });
    } catch (error) {
      return apiError(error);
    }
  });
};
