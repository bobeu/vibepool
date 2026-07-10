import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { FriendService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const friendService = new FriendService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const [friends, pending] = await Promise.all([
        friendService.getFriends(wallet),
        friendService.getPending(wallet),
      ]);
      return jsonResponse({ friends, pending });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const DELETE = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await friendService.removeFriend(wallet, body.friendWallet);
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
