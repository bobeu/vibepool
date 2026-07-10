import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { PresenceService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const presenceService = new PresenceService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const [presence, friends] = await Promise.all([
        presenceService.getPresence(wallet),
        presenceService.getFriendsPresence(wallet),
      ]);
      return jsonResponse({ presence, friends });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await presenceService.setPresence(wallet, body.status ?? "ONLINE");
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
