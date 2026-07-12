import { NextRequest } from "next/server";
import { revokeSession } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { AuthenticationError } from "@/lib/errors";

export const POST = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError(new AuthenticationError("No token provided"));
    }

    const accessToken = authHeader.slice(7);
    await revokeSession(accessToken);

    return jsonResponse({ loggedOut: true });
  } catch (error) {
    return apiError(error);
  }
};
