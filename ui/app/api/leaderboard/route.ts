import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { LeaderboardService } from "@/services/LeaderboardService";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { z } from "zod";

const leaderboardSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

function normalizeEntries(entries: Record<string, unknown>[]) {
  return entries.map((entry, index) => ({
    ...entry,
    userId: entry.userId ?? entry.wallet,
    user: { username: entry.username ?? "Player" },
    xp: entry.xp ?? 0,
    rank: entry.rank ?? index + 1,
  }));
}

export const GET = async (req: NextRequest) => {
  try {
    const url = new URL(req.url);
    const { limit } = leaderboardSchema.parse(Object.fromEntries(url.searchParams));

    const entries = await new LeaderboardService().getDaily(limit);
    const leaderboard = normalizeEntries(entries);
    return jsonResponse({ entries, leaderboard });
  } catch (error) {
    return apiError(error);
  }
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet, request) => {
    try {
      const body = await request.json();
      const { tournamentId } = z.object({ tournamentId: z.string().uuid() }).parse(body);
      const entries = await new LeaderboardService().getHistorical(tournamentId);
      const leaderboard = normalizeEntries(entries);
      return jsonResponse({ entries, leaderboard });
    } catch (error) {
      return apiError(error);
    }
  });
};
