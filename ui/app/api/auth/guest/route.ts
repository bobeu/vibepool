import { NextRequest } from "next/server";
import { prisma, createSession } from "@/lib/auth/session";
import { createGuestWallet, isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";

export { isGuestWallet };

/**
 * Create a free-play guest session — no wallet signature required.
 * MiniPay users can try Prediction, Arena, and Spin before connecting funds.
 */
export const POST = async (req: NextRequest) => {
  try {
    const flag = await prisma().featureFlag.findUnique({ where: { key: "free_play" } });
    if (flag && !flag.enabled) {
      return apiError(new Error("Free play is temporarily disabled"));
    }

    const wallet = createGuestWallet();
    const user = await prisma().userProfile.create({
      data: {
        wallet,
        username: "Guest Player",
        xp: 0,
        points: 0,
        spins: 5,
        level: 1,
        totalActivity: 0,
        status: "ACTIVE",
        lastLogin: new Date(),
      },
    });

    await prisma().spinLedger.create({
      data: {
        userId: user.id,
        spinType: "EVENT",
        amount: 5,
        reason: "FREE_PLAY_WELCOME",
      },
    });

    const { accessToken, refreshToken, expiresAt } = await createSession(prisma(), wallet, {
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return jsonResponse(
      {
        accessToken,
        refreshToken,
        wallet,
        expiresAt,
        isGuest: true,
        freePlay: true,
        spins: 5,
        message: "Free play session ready — no funds required.",
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
};
