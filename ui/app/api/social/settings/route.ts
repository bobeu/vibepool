import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { SocialSettingsService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const socialSettingsService = new SocialSettingsService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const settings = await socialSettingsService.getSettings(wallet);
      return jsonResponse({ settings });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const settings = await socialSettingsService.updateSettings(wallet, body);
      return jsonResponse({ settings });
    } catch (error) {
      return apiError(error);
    }
  });
};
