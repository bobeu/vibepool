import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { BadgeEngine } from "@/services/engines/BadgeEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const badgeEngine = new BadgeEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const badges = await badgeEngine.getAvailableBadges(wallet);
    return jsonResponse({ badges });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await badgeEngine.equipBadge(wallet, body.slug as string);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
