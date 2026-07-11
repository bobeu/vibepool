import { dormantLegacyRoute } from "@/lib/api/helpers";

export async function GET() {
  return dormantLegacyRoute("GET /api/reward", "GET /api/rewards");
}

export async function POST() {
  return dormantLegacyRoute("POST /api/reward", "POST /api/rewards/claim");
}
