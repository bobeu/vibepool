import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
      const history = await arenaService.getHistory(wallet, limit);
      return jsonResponse({ history });
    } catch (error) {
      return apiError(error);
    }
  });
};
