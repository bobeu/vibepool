import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { TournamentService } from "@/services/TournamentService";
import { LeaderboardService } from "@/services/LeaderboardService";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { z } from "zod";

const leaderboardSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const { limit } = leaderboardSchema.parse(Object.fromEntries(url.searchParams));

    const entries = await new LeaderboardService().getDaily(limit);
    return jsonResponse({ entries });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = authenticatedHandler(async (_wallet, req: NextRequest) => {
  try {
    const body = await req.json();
    const { tournamentId } = z.object({ tournamentId: z.string().uuid() }).parse(body);
    const entries = await new LeaderboardService().getHistorical(tournamentId);
    return jsonResponse({ entries });
  } catch (error) {
    return apiError(error);
  }
});
