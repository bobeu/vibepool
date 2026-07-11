import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { InsightEngine } from "@/services/engines/InsightEngine";

const engine = new InsightEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const insights = await engine.list(limit);
    return jsonResponse({ insights });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async () => {
    const generated = await engine.generate();
    return jsonResponse({ generated });
  });
