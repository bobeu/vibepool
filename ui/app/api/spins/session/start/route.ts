import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";
import { isSpinPayAsset } from "@/lib/spin/economy";

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const userId = await resolveUserId(wallet);
      const useTicket = body.useTicket !== false && !body.entryTxHash;

      const result = await spinHuntEngine.startSession({
        wallet,
        userId,
        useTicket,
        entryTxHash: body.entryTxHash ? String(body.entryTxHash) : undefined,
        sessionRef: body.sessionRef as `0x${string}` | undefined,
        entryAsset:
          body.entryAsset && isSpinPayAsset(String(body.entryAsset))
            ? body.entryAsset
            : undefined,
      });

      const status = (result as { success?: boolean }).success === false ? 402 : 201;
      return jsonResponse(result, status);
    } catch (error) {
      return apiError(error);
    }
  });
};
