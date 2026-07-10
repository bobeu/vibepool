import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { InviteService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const inviteService = new InviteService();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const invites = await inviteService.getInvites(wallet);
      return jsonResponse({ invites });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await inviteService.generate(wallet, body.type ?? "INVITE_CODE");
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
