import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { WheelEngine } from "@/services/engines/WheelEngine";
import { jsonResponse } from "@/lib/api/responses";

const wheelEngine = new WheelEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const userId = await resolveUserId(wallet);
    const history = await wheelEngine.getSpinHistory(userId, limit);
    return jsonResponse({ history });
  });
};
