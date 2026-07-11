import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { CampaignService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const campaignService = new CampaignService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async () => {
    try {
      const status = req.nextUrl.searchParams.get("status") ?? undefined;
      const campaigns = await campaignService.listCampaigns(status);
      return jsonResponse({ campaigns });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      if (body.action === "start" && body.campaignId) {
        const started = await campaignService.startCampaign(wallet, body.campaignId as string);
        return jsonResponse(started);
      }
      const campaign = await campaignService.createCampaign(wallet, body);
      return jsonResponse(campaign, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
