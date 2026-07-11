import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { CampaignEngine } from "@/services/engines/CampaignEngine";

const engine = new CampaignEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "campaigns:read", async (_wallet, request) => {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const versions = await engine.getVersionHistory(id);
      return jsonResponse({ versions });
    }
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const campaigns = await engine.listCampaigns(status);
    return jsonResponse({ campaigns });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "campaigns:write", async (wallet, request) => {
    const body = await request.json();
    let result: Record<string, unknown>;
    switch (body.action) {
      case "start":
        result = await engine.startCampaign(body.campaignId);
        break;
      case "pause":
        result = await engine.pauseCampaign(body.campaignId);
        break;
      case "resume":
        result = await engine.resumeCampaign(body.campaignId);
        break;
      case "clone":
        result = await engine.cloneCampaign(body.campaignId, wallet);
        break;
      case "rollback":
        result = await engine.rollbackCampaign(body.campaignId, Number(body.version));
        break;
      case "complete":
        result = await engine.completeCampaign(body.campaignId);
        break;
      default:
        result = await engine.createCampaign({ ...body, createdBy: wallet });
    }
    await auditAdminAction(wallet, body.action ?? "create", "campaigns", body.campaignId ?? result.id as string);
    return jsonResponse(result);
  });
