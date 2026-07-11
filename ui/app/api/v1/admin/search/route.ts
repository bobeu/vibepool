import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { GlobalSearchEngine } from "@/services/engines/observability/ObservabilityEngines";

const engine = new GlobalSearchEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (_wallet, request) => {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    const results = await engine.search(q, limit);
    return jsonResponse(results);
  });
