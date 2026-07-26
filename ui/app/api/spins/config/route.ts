import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";
import { SpinService } from "@/services/serviceImpl";

const spinService = new SpinService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const [config, balance] = await Promise.all([
        spinHuntEngine.getPublicConfig(),
        spinService.getAvailableSpins(wallet),
      ]);
      return jsonResponse({ config, balance });
    } catch (error) {
      return apiError(error);
    }
  });
};
