import { dormantLegacyRoute } from "@/lib/api/helpers";

export async function GET() {
  return dormantLegacyRoute("GET /api/spin", "GET /api/spins");
}

export async function POST() {
  return dormantLegacyRoute("POST /api/spin", "POST /api/spins");
}
