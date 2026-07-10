import { NextRequest } from "next/server";
import { authenticatedHandler, optionalAuthHandler } from "@/lib/auth/middleware";
import { CommunityService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const communityService = new CommunityService();

const adminWallets = (process.env.ADMIN_WALLETS ?? "")
  .split(",")
  .map((w) => w.trim().toLowerCase())
  .filter(Boolean);

export const GET = async (req: NextRequest) => {
  return optionalAuthHandler(req, async () => {
    try {
      const posts = await communityService.getPosts(20);
      return jsonResponse({ posts });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      if (adminWallets.length > 0 && !adminWallets.includes(wallet.toLowerCase())) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      const body = await req.json();
      const post = await communityService.createPost(wallet, body);
      return jsonResponse({ post }, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
