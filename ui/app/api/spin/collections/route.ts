import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { jsonResponse, apiError } from "@/lib/api/responses";
import { collectionEngine } from "@/services/engines/CollectionEngine";

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const userId = await resolveUserId(wallet);
      const [items, loadout] = await Promise.all([
        collectionEngine.listCatalog(userId),
        collectionEngine.resolveLoadout(userId),
      ]);
      return jsonResponse({ items, loadout });
    } catch (error) {
      return apiError(error);
    }
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      const body = await request.json();
      const userId = await resolveUserId(wallet);
      const action = String(body.action ?? "purchase");
      const itemId = String(body.itemId ?? "");
      if (!itemId) throw new Error("itemId required");

      if (action === "equip") {
        const result = await collectionEngine.equip(
          userId,
          itemId,
          body.equipped !== false
        );
        return jsonResponse(result);
      }

      if (!body.txHash && body.free !== true) {
        throw new Error("txHash required for purchase");
      }

      const result = await collectionEngine.purchase({
        wallet,
        userId,
        itemDbId: itemId,
        txHash: String(body.txHash ?? ""),
      });
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
