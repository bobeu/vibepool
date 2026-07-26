import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      if (!isGuestWallet(wallet)) {
        throw new Error("Live withdraw requires SpinPrizeVault — use free play for demo withdraw");
      }
      const userId = await resolveUserId(wallet);
      const result = await spinHuntEngine.mockWithdraw(wallet, userId);
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
