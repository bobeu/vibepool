import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { skillBoostEngine } from "@/services/engines/SkillBoostEngine";
import type { SkillBoostPurpose } from "@/lib/arena/skillBoost";

const PURPOSES = new Set<SkillBoostPurpose>(["ARENA_BOOST", "STAY_RELEVANT", "POINTS_GROWTH"]);

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const purpose = body.purpose as SkillBoostPurpose;
      const asset = body.asset as "cUSD" | "CELO";
      const txHash = String(body.txHash ?? "");

      if (!txHash.startsWith("0x") || txHash.length < 66) {
        throw new Error("Invalid transaction hash");
      }
      if (!PURPOSES.has(purpose)) throw new Error("Invalid boost purpose");
      if (asset !== "cUSD" && asset !== "CELO") throw new Error("Invalid asset");

      const result = await skillBoostEngine.recordAndApply({
        wallet,
        txHash,
        asset,
        purpose,
        matchId: body.matchId,
      });
      return jsonResponse(result);
    } catch (error) {
      return apiError(error);
    }
  });
};

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const status = await skillBoostEngine.getStatus(wallet);
      return jsonResponse(status);
    } catch (error) {
      return apiError(error);
    }
  });
};
