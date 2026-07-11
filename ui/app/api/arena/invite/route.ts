import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { ArenaService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const arenaService = new ArenaService();

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      if (body.friendWallet) {
        return jsonResponse(await arenaService.createInvite(wallet, body.friendWallet));
      }
      if (body.inviteCode) {
        return jsonResponse(await arenaService.joinByInviteCode(wallet, body.inviteCode));
      }
      if (body.rematchOf) {
        return jsonResponse(await arenaService.createRematch(wallet, body.rematchOf));
      }
      throw new Error("Invalid invite payload");
    } catch (error) {
      return apiError(error);
    }
  });
};
