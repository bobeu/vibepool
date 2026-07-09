import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { SpinService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const state = await SpinService.getAvailableSpins(wallet);
    return jsonResponse(state);
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const result = await SpinService.executeSpin(wallet);
    return jsonResponse(result, 201);
  });
};
