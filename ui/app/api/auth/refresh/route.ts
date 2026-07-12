import { NextRequest } from "next/server";
import { prisma, refreshSession } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { z } from "zod";

const refreshSchema = z.object({
  refreshToken: z.string().min(32),
});

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { refreshToken } = refreshSchema.parse(body);

    const session = await refreshSession(prisma(), refreshToken);
    if (!session) {
      return apiError(new Error("Invalid refresh token"), { status: 401 });
    }

    return jsonResponse({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: 24 * 60 * 60,
    });
  } catch (error) {
    return apiError(error);
  }
};
