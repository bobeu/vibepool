import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ActivityService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const activities = await ActivityService.getRecent(wallet, limit);
    return jsonResponse({ activities });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await ActivityService.record(wallet, body.type as string, body.metadata);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
