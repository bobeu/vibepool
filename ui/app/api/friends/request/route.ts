import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { FriendService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const friendService = new FriendService();

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await friendService.sendRequest(wallet, body.wallet, body.message);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
