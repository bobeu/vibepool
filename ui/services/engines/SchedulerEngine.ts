import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { ISchedulerEngine } from "./interfaces";

type JobHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;

export class SchedulerEngine implements ISchedulerEngine {
  name = "SchedulerEngine";
  private handlers = new Map<string, JobHandler>();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  registerHandler(jobType: string, handler: JobHandler): void {
    this.handlers.set(jobType, handler);
  }

  async schedule(
    jobType: string,
    scheduledAt: Date,
    payload?: Record<string, unknown>,
    idempotencyKey?: string
  ): Promise<Record<string, unknown>> {
    if (idempotencyKey) {
      const existing = await prisma().scheduledJob.findUnique({ where: { idempotencyKey } });
      if (existing) return { id: existing.id, duplicate: true };
    }

    const job = await prisma().scheduledJob.create({
      data: {
        jobType: jobType as any,
        scheduledAt,
        payload: payload ?? undefined,
        idempotencyKey: idempotencyKey ?? null,
      },
    });

    return { id: job.id, jobType: job.jobType, scheduledAt: job.scheduledAt };
  }

  async runDueJobs(limit = 20): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const jobs = await prisma().scheduledJob.findMany({
      where: { status: "PENDING", scheduledAt: { lte: now } },
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });

    const results: Record<string, unknown>[] = [];
    for (const job of jobs) {
      results.push(await this.runJob(job.id));
    }
    return results;
  }

  async runJob(jobId: string): Promise<Record<string, unknown>> {
    const job = await prisma().scheduledJob.findUnique({ where: { id: jobId } });
    if (!job || job.status !== "PENDING") return { id: jobId, skipped: true };

    await prisma().scheduledJob.update({
      where: { id: jobId },
      data: { status: "RUNNING", startedAt: new Date() },
    });

    const handler = this.handlers.get(job.jobType);
    if (!handler) {
      await this.failJob(jobId, `No handler for ${job.jobType}`);
      return { id: jobId, error: "No handler" };
    }

    try {
      const result = await handler((job.payload as Record<string, unknown>) ?? {});
      await prisma().scheduledJob.update({
        where: { id: jobId },
        data: { status: "COMPLETED", completedAt: new Date(), result: result as object },
      });
      return { id: jobId, status: "COMPLETED", result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (job.retryCount < job.maxRetries) {
        await prisma().scheduledJob.update({
          where: { id: jobId },
          data: {
            status: "PENDING",
            retryCount: job.retryCount + 1,
            error: message,
            scheduledAt: new Date(Date.now() + 60_000 * (job.retryCount + 1)),
          },
        });
        return { id: jobId, retry: job.retryCount + 1, error: message };
      }
      await this.failJob(jobId, message);
      return { id: jobId, status: "DEAD_LETTER", error: message };
    }
  }

  private async failJob(jobId: string, error: string): Promise<void> {
    await prisma().scheduledJob.update({
      where: { id: jobId },
      data: { status: "DEAD_LETTER", error, completedAt: new Date() },
    });
    logger.error("Scheduled job dead-lettered", { jobId, error });
  }
}
