import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { IdentityEngine } from "@/services/engines/IdentityEngine";
import { jsonResponse, apiError } from "@/lib/api/responses";

const identityEngine = new IdentityEngine();

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    const identity = await identityEngine.getIdentity(wallet);
    return jsonResponse(identity);
  });
};

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet, req: NextRequest) => {
    try {
      const body = await req.json();
      const result = await identityEngine.updateIdentity(wallet, body);
      return jsonResponse(result, 201);
    } catch (error) {
      return apiError(error);
    }
  });
};
