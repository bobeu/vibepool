import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { LiveOpsService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const liveOpsService = new LiveOpsService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async () => {
    try {
      const limit = Number(req.nextUrl.searchParams.get("limit") ?? 20);
      const events = await liveOpsService.listEvents(limit);
      return jsonResponse({ events });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      const event = await liveOpsService.createEvent(wallet, body);
      return jsonResponse(event, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
