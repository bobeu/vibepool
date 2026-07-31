import { NextRequest } from "next/server";
import { prisma, createSession } from "@/lib/auth/session";
import { createGuestWallet, isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";

export { isGuestWallet };

const FLAG_TTL_MS = 60_000;
let flagCache: { enabled: boolean; checkedAt: number } | null = null;

/** Guest creation is on the critical path for first paint, so cache the gate. */
async function freePlayEnabled(): Promise<boolean> {
  if (flagCache && Date.now() - flagCache.checkedAt < FLAG_TTL_MS) {
    return flagCache.enabled;
  }
  const flag = await prisma().featureFlag.findUnique({ where: { key: "free_play" } });
  const enabled = flag ? flag.enabled : true;
  flagCache = { enabled, checkedAt: Date.now() };
  return enabled;
}

/**
 * Create a free-play guest session — no wallet signature required.
 * MiniPay users can try Prediction, Arena, and Spin before connecting funds.
 */
export const POST = async (req: NextRequest) => {
  try {
    if (!(await freePlayEnabled())) {
      return apiError(new Error("Free play is temporarily disabled"));
    }

    const wallet = createGuestWallet();
    const { FREEPLAY_MAX_SPINS } = await import("@/lib/spin/freePlay");
    // Profile + welcome ledger in one round trip.
    const user = await prisma().userProfile.create({
      data: {
        wallet,
        username: "Guest Player",
        xp: 0,
        points: 0,
        spins: FREEPLAY_MAX_SPINS,
        level: 1,
        totalActivity: 0,
        status: "ACTIVE",
        lastLogin: new Date(),
        spinLedgers: {
          create: {
            spinType: "EVENT",
            amount: FREEPLAY_MAX_SPINS,
            reason: "FREE_PLAY_WELCOME",
          },
        },
      },
      select: { id: true },
    });

    const { accessToken, refreshToken, expiresAt } = await createSession(prisma(), wallet, {
      userAgent: req.headers.get("user-agent") ?? undefined,
      userId: user.id,
    });

    return jsonResponse(
      {
        accessToken,
        refreshToken,
        wallet,
        expiresAt,
        isGuest: true,
        freePlay: true,
        spins: FREEPLAY_MAX_SPINS,
        message: "Free play session ready — no funds required.",
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
};
