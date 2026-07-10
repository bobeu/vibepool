import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { SpinService } from "@/services/serviceImpl";
import { WheelEngine } from "@/services/engines/WheelEngine";
import { SecureRandomProvider } from "@/services/engines/SecureRandomProvider";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const state = await SpinService.getAvailableSpins(wallet);
    return jsonResponse(state);
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json();
      const action = body.action as string;

      if (action === "start") {
        const result = await SpinService.executeSpin(wallet);
        return jsonResponse(result, 201);
      }

      if (action === "claim") {
        const spinId = body.spinId as string;
        const wheelEngine = new WheelEngine();
        const result = await wheelEngine.generateReward(spinId, new SecureRandomProvider());
        return jsonResponse(result, 201);
      }

      return apiError(new Error("Invalid action"));
    } catch (error) {
      return apiError(error);
    }
  });
};
