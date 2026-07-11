import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { ContentEngine } from "@/services/engines/ContentEngine";

const engine = new ContentEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "content:read", async (_wallet, request) => {
    const placement = request.nextUrl.searchParams.get("placement") ?? undefined;
    const locale = request.nextUrl.searchParams.get("locale") ?? "en";
    const locales = request.nextUrl.searchParams.get("locales");
    if (locales === "1") {
      return jsonResponse({ locales: await engine.listLocales(placement) });
    }
    const blocks = await engine.getBlocks(placement, locale);
    return jsonResponse({ blocks });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "content:write", async (wallet, request) => {
    const body = await request.json();
    const block = await engine.createBlock(body);
    await auditAdminAction(wallet, "create_block", "content", block.id as string);
    return jsonResponse(block, 201);
  });
