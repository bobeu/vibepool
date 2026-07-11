import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { SchedulerService } from "@/services/serviceImpl";
import { jsonResponse, apiError } from "@/lib/api/responses";

const schedulerService = new SchedulerService();

export const POST = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const body = await req.json().catch(() => ({}));
      const limit = Number(body.limit ?? 20);
      const results = await schedulerService.runDueJobs(wallet, limit);
      return jsonResponse({ results });
    } catch (error) {
      return apiError(error);
    }
  });
};
