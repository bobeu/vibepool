import { NextRequest } from "next/server";
import { prisma, refreshSession } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { AuthenticationError } from "@/lib/errors";
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
      return apiError(new AuthenticationError("Invalid refresh token"));
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
