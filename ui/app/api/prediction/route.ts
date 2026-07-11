import { NextRequest } from "next/server";
import { dormantLegacyRoute, checkRateLimit } from "@/lib/api/helpers";

export async function GET() {
  return dormantLegacyRoute("GET /api/prediction", "GET /api/predictions");
}

export async function POST(req: NextRequest) {
  const wallet = req.headers.get("x-wallet-address") ?? "anon";
  const limit = checkRateLimit(`prediction:${wallet}`);
  if (!limit.allowed) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }
  return dormantLegacyRoute("POST /api/prediction", "POST /api/predictions");
}
