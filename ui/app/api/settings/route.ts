import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { SettingsService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const settingsService = new SettingsService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async () => {
    const settings = await settingsService.getAll();
    return jsonResponse({ settings });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet, request) => {
    try {
      const body = await request.json();
      const key = body.key as string;
      const value = body.value as string;
      await settingsService.set(key, value);
      return jsonResponse({ key, value }, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
