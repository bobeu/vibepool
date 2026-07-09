import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ProfileService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { profileSchema } from "@/lib/validation/schemas";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const profile = await ProfileService.getByWallet(wallet);
    if (!profile) {
      return apiError(new Error("Profile not found"));
    }
    return jsonResponse(profile);
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const parsed = profileSchema.parse(body);
      const profile = await ProfileService.upsert(wallet, parsed);
      return jsonResponse(profile, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
