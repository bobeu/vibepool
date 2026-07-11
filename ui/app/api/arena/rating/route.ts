import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const rating = await arenaService.getRating(wallet);
      return jsonResponse(rating);
    } catch (error) {
      return apiError(error);
    }
  });
};
