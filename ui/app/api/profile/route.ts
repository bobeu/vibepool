import type { NextRequest } from "next/server";
import { notImplemented, checkRateLimit, getWalletFromRequest } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  const wallet = getWalletFromRequest(req);
  const rl = checkRateLimit(wallet ?? req.ip ?? "anon");
  if (!rl.allowed) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return notImplemented("GET /api/profile");
}

export async function PUT(req: NextRequest) {
  return notImplemented("PUT /api/profile");
}
