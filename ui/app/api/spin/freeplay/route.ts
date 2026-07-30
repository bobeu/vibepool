import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";
import {
  spinPackById,
  FREEPLAY_SPIN_PACKS,
  FREEPLAY_REFILL_SPINS,
  FREEPLAY_MAX_SPINS,
  canRefillOrBuyDemoSpins,
} from "@/lib/spin/freePlay";
import { prisma } from "@/lib/auth/session";
import { SpinEngine } from "@/services/engines/SpinEngine";
import { musicEngine } from "@/services/engines/MusicEngine";
import { collectionEngine } from "@/services/engines/CollectionEngine";

const spinEngine = new SpinEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const canManage = canRefillOrBuyDemoSpins(wallet);
    if (!isGuestWallet(wallet) && !canManage) {
      return jsonResponse({ freePlay: false, packs: [], canRefill: false });
    }
    return jsonResponse({
      freePlay: isGuestWallet(wallet) || canManage,
      packs: canManage ? FREEPLAY_SPIN_PACKS : [],
      canRefill: canManage,
      maxSpins: FREEPLAY_MAX_SPINS,
    });
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const userId = await resolveUserId(wallet);
      const body = await request.json();
      const action = String(body.action ?? "");
      const guest = isGuestWallet(wallet);
      const canManage = canRefillOrBuyDemoSpins(wallet);

      // Guest free-play: mock shop for music/items only (no spin refill for normal guests).
      if (action === "purchaseMusic" || action === "purchaseItem") {
        if (!guest && !canManage) {
          throw new Error("Free-play purchases are for guest testers only");
        }
        if (action === "purchaseMusic") {
          const trackId = String(body.trackId ?? "");
          if (!trackId) throw new Error("trackId required");
          const result = await musicEngine.purchase({ wallet, userId, trackId });
          return jsonResponse({ ...result, mock: true }, 201);
        }
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

      // Spin refill / demo packs: only allowlisted wallets (unlimited free-mode testers).
      if (action === "buySpins" || action === "refillSpins") {
        if (!canManage) {
          throw new Error(
            guest
              ? "Free spins are limited — refill is reserved for authorized testers"
              : "Spin refill is only available for authorized free-mode tester wallets"
          );
        }

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

        const profile = await prisma().userProfile.findUnique({ where: { id: userId } });
        if (!profile) throw new Error("User not found");
        const target = FREEPLAY_REFILL_SPINS;
        // Unlimited testers: always top up by at least FREEPLAY_REFILL_SPINS from current.
        const need = Math.max(FREEPLAY_REFILL_SPINS, target - profile.spins);
        if (need > 0) {
          await prisma().userProfile.update({
            where: { id: userId },
            data: { spins: { increment: need } },
          });
          await prisma().spinLedger.create({
            data: {
              userId,
              spinType: "EVENT",
              amount: need,
              reason: "FREEPLAY_ADMIN_REFILL",
            },
          });
        }
        const balance = await spinEngine.getSpinBalance(userId);
        return jsonResponse({
          success: true,
          mock: true,
          refilled: need,
          balance,
          message: need > 0 ? `Spins refilled (+${need})` : "Spins already full",
        });
      }

      throw new Error("Invalid free-play action");
    } catch (error) {
      return apiError(error);
    }
  });
};
