import type { NextRequest } from "next/server";
import { notImplemented, checkRateLimit } from "@/lib/api/helpers";

export async function GET(req: NextRequest) {
  checkRateLimit("prediction-get");
  return notImplemented("GET /api/prediction");
}

export async function POST(req: NextRequest) {
  return notImplemented("POST /api/prediction");
}
