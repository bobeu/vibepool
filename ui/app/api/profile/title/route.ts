import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { TitleEngine } from "@/services/engines/TitleEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const titleEngine = new TitleEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const titles = await titleEngine.getAvailableTitles(wallet);
    return jsonResponse({ titles });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await titleEngine.equipTitle(wallet, body.slug as string);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
