import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { LiveOpsService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const liveOpsService = new LiveOpsService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async (wallet) => {
    try {
      const placement = req.nextUrl.searchParams.get("placement") ?? undefined;
      const banners = await liveOpsService.getBanners(placement, wallet);
      return jsonResponse({ banners });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      if (body.action === "dismiss" && body.bannerId) {
        await liveOpsService.dismissBanner(wallet, body.bannerId as string);
        return jsonResponse({ dismissed: true });
      }
      const banner = await liveOpsService.publishBanner(wallet, body);
      return jsonResponse(banner, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
