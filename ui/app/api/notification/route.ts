import { dormantLegacyRoute } from "@/lib/api/helpers";

export async function GET() {
  return dormantLegacyRoute("GET /api/notification", "GET /api/notifications");
}
