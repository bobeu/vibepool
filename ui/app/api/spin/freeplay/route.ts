import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinPackById, FREEPLAY_SPIN_PACKS, FREEPLAY_REFILL_SPINS } from "@/lib/spin/freePlay";
import { prisma } from "@/lib/auth/session";
import { SpinEngine } from "@/services/engines/SpinEngine";
import { musicEngine } from "@/services/engines/MusicEngine";
import { collectionEngine } from "@/services/engines/CollectionEngine";

const spinEngine = new SpinEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    if (!isGuestWallet(wallet)) {
      return jsonResponse({ freePlay: false, packs: [] });
    }
    return jsonResponse({ freePlay: true, packs: FREEPLAY_SPIN_PACKS });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      if (!isGuestWallet(wallet)) {
        throw new Error("Free-play actions are for guest testers only");
      }
      const userId = await resolveUserId(wallet);
      const body = await request.json();
      const action = String(body.action ?? "");

      if (action === "buySpins") {
        const pack = spinPackById(String(body.packId ?? ""));
        if (!pack) throw new Error("Invalid spin pack");
        for (let i = 0; i < pack.spins; i++) {
          await spinEngine.grantSpin(userId, "EVENT", `FREEPLAY_PACK_${pack.id}`);
        }
        const balance = await spinEngine.getSpinBalance(userId);
        return jsonResponse({
          success: true,
          mock: true,
          granted: pack.spins,
          mockPrice: pack.mockPrice,
          balance,
          message: `Added ${pack.spins} spins (demo)`,
        });
      }

      if (action === "refillSpins") {
        const profile = await prisma().userProfile.findUnique({ where: { id: userId } });
        if (!profile) throw new Error("User not found");
        const target = FREEPLAY_REFILL_SPINS;
        const need = Math.max(0, target - profile.spins);
        if (need > 0) {
          await prisma().userProfile.update({
            where: { id: userId },
            data: { spins: target },
          });
          await prisma().spinLedger.create({
            data: {
              userId,
              spinType: "EVENT",
              amount: need,
              reason: "FREEPLAY_TRY_AGAIN_REFILL",
            },
          });
        }
        const balance = await spinEngine.getSpinBalance(userId);
        return jsonResponse({
          success: true,
          mock: true,
          refilled: need,
          balance,
          message: need > 0 ? `Spins refilled to ${target}` : "Spins already full",
        });
      }

      if (action === "purchaseMusic") {
        const trackId = String(body.trackId ?? "");
        if (!trackId) throw new Error("trackId required");
        const result = await musicEngine.purchase({ wallet, userId, trackId });
        return jsonResponse({ ...result, mock: true }, 201);
      }

      if (action === "purchaseItem") {
        const itemId = String(body.itemId ?? "");
        if (!itemId) throw new Error("itemId required");
        const result = await collectionEngine.purchase({
          wallet,
          userId,
          itemDbId: itemId,
          txHash: "",
        });
        return jsonResponse({ ...result, mock: true }, 201);
      }

      throw new Error("Invalid free-play action");
    } catch (error) {
      return apiError(error);
    }
  });
};
