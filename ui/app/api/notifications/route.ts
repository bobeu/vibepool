import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { NotificationService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const notifications = await NotificationService.getUnread(wallet);
    return jsonResponse({ notifications });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      await NotificationService.markRead(body.id as string);
      return jsonResponse({ read: true });
    } catch (error) {
      return apiError(error);
    }
  });
};
