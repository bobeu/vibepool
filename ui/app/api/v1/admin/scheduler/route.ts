import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { getSchedulerEngine } from "@/services/schedulerRegistry";

const engine = getSchedulerEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "scheduler:read", async (_wallet, request) => {
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const graph = request.nextUrl.searchParams.get("graph");
    if (graph === "1") {
      return jsonResponse({ graph: await engine.getDependencyGraph() });
    }
    const jobs = await engine.listJobs({ status, limit: 100 });
    return jsonResponse({ jobs });
  });

export const POST = (req: NextRequest) =>
  adminHandler(req, "scheduler:execute", async (wallet, request) => {
    const body = await request.json();
    let result: Record<string, unknown>;
    switch (body.action) {
      case "run_due":
        result = { results: await engine.runDueJobs(body.limit ?? 20) };
        break;
      case "run":
        result = await engine.runJob(body.jobId);
        break;
      case "dry_run":
        result = await engine.dryRunJob(body.jobId);
        break;
      case "pause":
        result = await engine.pauseJob(body.jobId);
        break;
      case "resume":
        result = await engine.resumeJob(body.jobId);
        break;
      case "cancel":
        result = await engine.cancelJob(body.jobId);
        break;
      case "schedule":
        result = await engine.schedule(body.jobType, new Date(body.scheduledAt), body.payload, {
          dependsOnJobIds: body.dependsOnJobIds,
          dryRun: body.dryRun,
          idempotencyKey: body.idempotencyKey,
        });
        break;
      default:
        throw new Error("Unknown action");
    }
    await auditAdminAction(wallet, body.action, "scheduler", body.jobId);
    return jsonResponse(result);
  });
