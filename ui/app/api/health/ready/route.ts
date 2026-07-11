import { prisma } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/api/responses";

export const GET = async () => {
  try {
    await prisma().userProfile.count();
    return jsonResponse({ status: "ready", timestamp: new Date().toISOString() });
  } catch {
    return jsonResponse({ status: "not_ready", timestamp: new Date().toISOString() }, 503);
  }
};
