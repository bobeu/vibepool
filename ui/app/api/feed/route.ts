import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { FeedService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const feedService = new FeedService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const items = await feedService.getFeed(wallet, 30);
      return jsonResponse({ feed: items });
    } catch (error) {
      return apiError(error);
    }
  });
};
