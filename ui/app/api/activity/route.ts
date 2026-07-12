import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ActivityService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const activityService = new ActivityService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const activities = await activityService.getRecent(wallet, limit);
    return jsonResponse({ activities });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const result = await activityService.record(wallet, body.type as string, body.metadata);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
