import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return jsonResponse({ session: null }, 401);
    }
    return jsonResponse({
      session: {
        wallet: session.wallet,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return apiError(error);
  }
};
