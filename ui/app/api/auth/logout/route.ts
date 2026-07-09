import { NextRequest } from "next/server";
import { prisma } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const POST = async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return apiError(new Error("No token provided"), { status: 401 });
    }

    const accessToken = authHeader.slice(7);

    const session = await prisma().session.findFirst({
      where: {
        refreshToken: accessToken,
        status: "ACTIVE",
      },
    });

    if (session) {
      await prisma().session.update({
        where: { id: session.id },
        data: { status: "REVOKED" },
      });

      await prisma().refreshToken.updateMany({
        where: { sessionId: session.id, status: "ACTIVE" },
        data: { status: "REVOKED" },
      });
    }

    return jsonResponse({ loggedOut: true });
  } catch (error) {
    return apiError(error);
  }
};
