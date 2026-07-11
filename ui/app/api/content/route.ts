import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { ContentService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const contentService = new ContentService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async (wallet) => {
    try {
      const placement = req.nextUrl.searchParams.get("placement") ?? undefined;
      const locale = req.nextUrl.searchParams.get("locale") ?? "en";
      const hero = req.nextUrl.searchParams.get("hero");

      if (hero === "1") {
        const banner = await contentService.getHeroBanner(wallet);
        return jsonResponse({ hero: banner });
      }

      const blocks = await contentService.getBlocks(placement, locale);
      return jsonResponse({ blocks });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      const block = await contentService.createBlock(wallet, body);
      return jsonResponse(block, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
