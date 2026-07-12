import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const profileService = new ProfileService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const profile = await profileService.getByWallet(wallet);
    return jsonResponse({ profile });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const profile = await profileService.upsert(wallet, body);
      return jsonResponse({ profile }, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
