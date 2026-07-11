import { dormantLegacyRoute } from "@/lib/api/helpers";

export async function POST() {
  return dormantLegacyRoute("POST /api/wallet", "POST /api/auth/login");
}
