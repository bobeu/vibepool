import { NextRequest } from "next/server";
import { optionalAuthHandler, authenticatedHandler } from "@/lib/auth/middleware";
import { FeatureFlagService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const featureFlagService = new FeatureFlagService();

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async (wallet) => {
    try {
      const key = req.nextUrl.searchParams.get("key");
      if (key) {
        const enabled = await featureFlagService.isEnabled(key, { wallet, minipay: req.headers.get("x-minipay") === "true" });
        return jsonResponse({ key, enabled });
      }
      if (!wallet) return jsonResponse({ error: "Unauthorized" }, 401);
      const flags = await featureFlagService.listFlags(wallet);
      return jsonResponse({ flags });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      const flag = await featureFlagService.upsertFlag(wallet, body);
      return jsonResponse(flag);
    } catch (error) {
      return apiError(error);
    }
  });
};
