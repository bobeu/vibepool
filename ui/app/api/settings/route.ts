import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { SettingsService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async () => {
    const settings = await SettingsService.getAll();
    return jsonResponse({ settings });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const key = body.key as string;
      const value = body.value as string;
      await SettingsService.set(key, value);
      return jsonResponse({ key, value }, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
