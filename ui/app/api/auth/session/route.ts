import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return jsonResponse({ session: null }, 401);
    }
    const isGuest = isGuestWallet(session.wallet);
    return jsonResponse({
      session: {
        wallet: session.wallet,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
        isGuest,
        freePlay: isGuest,
      },
    });
  } catch (error) {
    return apiError(error);
  }
};
