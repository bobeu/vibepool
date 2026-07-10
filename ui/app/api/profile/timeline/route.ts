import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { prisma } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const snapshots = await prisma().progressSnapshot.findMany({
      where: { userId: wallet },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return jsonResponse({ timeline: snapshots });
  });
};
