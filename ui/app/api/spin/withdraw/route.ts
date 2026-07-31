import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { isGuestWallet } from "@/lib/auth/guest";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";
import { verifySpinWithdraw } from "@/lib/blockchain/verifySpinWithdraw";
import { isSpinPayAsset } from "@/lib/spin/economy";

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const userId = await resolveUserId(wallet);
      if (isGuestWallet(wallet)) {
        return jsonResponse(await spinHuntEngine.mockWithdraw(wallet, userId));
      }

      const body = await request.json();
      const asset = String(body.asset ?? "");
      const txHash = String(body.txHash ?? "");
      const amountWei = BigInt(String(body.amountWei ?? "0"));
      if (!isSpinPayAsset(asset)) throw new Error("Invalid withdraw asset");
      if (!txHash || amountWei <= 0n) throw new Error("txHash and amountWei required");

      await verifySpinWithdraw({
        txHash,
        expectedWallet: wallet,
        expectedAsset: asset,
        expectedAmountWei: amountWei,
      });
      const result = await spinHuntEngine.recordOnchainWithdraw({
        userId,
        asset,
        amountWei,
        txHash,
      });
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};
