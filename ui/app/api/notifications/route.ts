import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { NotificationEngine } from "@/services/engines/NotificationEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const notificationEngine = new NotificationEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const notifications = await notificationEngine.getUnread(userId);
      return jsonResponse({ notifications });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const userId = await resolveUserId(wallet);
      const body = await request.json();
      const id = String(body.id || "");
      if (!id) return jsonResponse({ error: "Notification id required" }, 400);
      await notificationEngine.markRead(id, userId);
      return jsonResponse({ read: true });
    } catch (error) {
      return apiError(error);
    }
  });
};
