import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { NotificationEngine } from "@/services/engines/NotificationEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const notificationEngine = new NotificationEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const notifications = await notificationEngine.getUnread(wallet);
    return jsonResponse({ notifications });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      await notificationEngine.markRead(body.id as string, wallet);
      return jsonResponse({ read: true });
    } catch (error) {
      return apiError(error);
    }
  });
};
