import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { readVaultLiquidBalance } from "@/lib/blockchain/spinVault";
import {
  isSpinPayAsset,
  scaleSpinAmountToAsset,
  type SpinPayAsset,
} from "@/lib/spin/economy";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";

/**
 * Returns whether the vault can back a full spin payout for the asset.
 * Never exposes liquidBalance / reserved amounts to the client.
 */
export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (_wallet, request) => {
    try {
      const assetParam = request.nextUrl.searchParams.get("asset") || "USDm";
      if (!isSpinPayAsset(assetParam)) {
        return jsonResponse({ error: "Invalid asset" }, 400);
      }
      const asset = assetParam as SpinPayAsset;
      const cfg = await spinHuntEngine.getPublicConfig();
      const required18 = BigInt(cfg.maxCashPerSpinWei || "0");
      const required = scaleSpinAmountToAsset(required18 > 0n ? required18 : 0n, asset);
      const liquid = await readVaultLiquidBalance(asset);

      // Free-play / unknown vault: treat as sufficient so UX is not blocked offline.
      const sufficient =
        liquid == null ? true : required <= 0n ? liquid > 0n : liquid >= required;

      return jsonResponse({
        asset,
        sufficient,
        checked: liquid != null,
      });
    } catch (error) {
      return apiError(error);
    }
  });
};
