import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { ISchedulerEngine } from "./interfaces";

type JobHandler = (payload: Record<string, unknown>, options?: { dryRun?: boolean }) => Promise<Record<string, unknown>>;

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
    options?: { idempotencyKey?: string; dependsOnJobIds?: string[]; dryRun?: boolean }
  ): Promise<Record<string, unknown>> {
    if (options?.idempotencyKey) {
      const existing = await prisma().scheduledJob.findUnique({ where: { idempotencyKey: options.idempotencyKey } });
      if (existing) return { id: existing.id, duplicate: true };
    }

    const job = await prisma().scheduledJob.create({
      data: {
        jobType: jobType as any,
        scheduledAt,
        payload: payload ?? undefined,
        idempotencyKey: options?.idempotencyKey ?? null,
        dryRun: Boolean(options?.dryRun),
      },
    });

    if (options?.dependsOnJobIds?.length) {
      await prisma().scheduledJobDependency.createMany({
        data: options.dependsOnJobIds.map((dependsOnJobId) => ({ jobId: job.id, dependsOnJobId })),
      });
    }

    return { id: job.id, jobType: job.jobType, scheduledAt: job.scheduledAt, dryRun: job.dryRun };
  }

  async listJobs(filter?: { status?: string; limit?: number }): Promise<Record<string, unknown>[]> {
    const jobs = await prisma().scheduledJob.findMany({
      where: filter?.status ? { status: filter.status as any } : undefined,
      orderBy: { scheduledAt: "asc" },
      take: filter?.limit ?? 50,
      include: { dependencies: { include: { dependsOn: true } } },
    });
    return jobs.map((j) => ({
      id: j.id,
      jobType: j.jobType,
      status: j.status,
      scheduledAt: j.scheduledAt,
      dryRun: j.dryRun,
      paused: j.paused,
      retryCount: j.retryCount,
      error: j.error,
      dependencies: j.dependencies.map((d) => ({ id: d.dependsOnJobId, status: d.dependsOn.status })),
    }));
  }

  async dryRunJob(jobId: string): Promise<Record<string, unknown>> {
    return this.runJob(jobId, { dryRun: true });
  }

  async pauseJob(jobId: string): Promise<Record<string, unknown>> {
    const job = await prisma().scheduledJob.update({ where: { id: jobId }, data: { paused: true } });
    return { id: job.id, paused: true };
  }

  async resumeJob(jobId: string): Promise<Record<string, unknown>> {
    const job = await prisma().scheduledJob.update({ where: { id: jobId }, data: { paused: false } });
    return { id: job.id, paused: false };
  }

  async cancelJob(jobId: string): Promise<Record<string, unknown>> {
    await prisma().scheduledJob.update({
      where: { id: jobId },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
    return { id: jobId, status: "CANCELLED" };
  }

  async getDependencyGraph(): Promise<Record<string, unknown>[]> {
    const deps = await prisma().scheduledJobDependency.findMany({
      include: { job: true, dependsOn: true },
    });
    return deps.map((d) => ({
      jobId: d.jobId,
      jobType: d.job.jobType,
      jobStatus: d.job.status,
      dependsOnJobId: d.dependsOnJobId,
      dependsOnType: d.dependsOn.jobType,
      dependsOnStatus: d.dependsOn.status,
    }));
  }

  async runDueJobs(limit = 20): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const jobs = await prisma().scheduledJob.findMany({
      where: { status: "PENDING", scheduledAt: { lte: now }, paused: false },
      orderBy: { scheduledAt: "asc" },
      take: limit,
      include: { dependencies: { include: { dependsOn: true } } },
    });

    const results: Record<string, unknown>[] = [];
    for (const job of jobs) {
      const depsMet = (job.dependencies ?? []).every((d) => d.dependsOn.status === "COMPLETED");
      if (!depsMet) {
        results.push({ id: job.id, skipped: true, reason: "Dependencies not met" });
        continue;
      }
      results.push(await this.runJob(job.id));
    }
    return results;
  }

  async runJob(jobId: string, options?: { dryRun?: boolean }): Promise<Record<string, unknown>> {
    const job = await prisma().scheduledJob.findUnique({ where: { id: jobId } });
    if (!job || (job.status !== "PENDING" && !options?.dryRun)) return { id: jobId, skipped: true };
    if (job.paused) return { id: jobId, skipped: true, reason: "Paused" };

    const isDryRun = options?.dryRun ?? job.dryRun;
    const queueDelayMs = Math.max(0, Date.now() - job.scheduledAt.getTime());
    const started = Date.now();

    if (!isDryRun) {
      await prisma().scheduledJob.update({
        where: { id: jobId },
        data: { status: "RUNNING", startedAt: new Date() },
      });
    }

    const handler = this.handlers.get(job.jobType);
    if (!handler) {
      if (!isDryRun) await this.failJob(jobId, `No handler for ${job.jobType}`);
      return { id: jobId, error: "No handler", dryRun: isDryRun };
    }

    try {
      const result = await handler((job.payload as Record<string, unknown>) ?? {}, { dryRun: isDryRun });
      const runtimeMs = Date.now() - started;
      if (!isDryRun) {
        await this.recordMetrics({
          jobId,
          jobType: job.jobType,
          runtimeMs,
          retryCount: job.retryCount,
          queueDelayMs,
          success: true,
        });
      }
      if (isDryRun) {
        return { id: jobId, status: "DRY_RUN", result, dryRun: true };
      }
      await prisma().scheduledJob.update({
        where: { id: jobId },
        data: { status: "COMPLETED", completedAt: new Date(), result: result as object },
      });
      return { id: jobId, status: "COMPLETED", result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const runtimeMs = Date.now() - started;
      if (!isDryRun) {
        await this.recordMetrics({
          jobId,
          jobType: job.jobType,
          runtimeMs,
          retryCount: job.retryCount,
          queueDelayMs,
          success: false,
        });
      }
      if (isDryRun) return { id: jobId, status: "DRY_RUN_ERROR", error: message, dryRun: true };
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

  private async recordMetrics(data: {
    jobId: string;
    jobType: string;
    runtimeMs: number;
    retryCount: number;
    queueDelayMs: number;
    success: boolean;
  }): Promise<void> {
    try {
      await prisma().schedulerMetric.create({
        data: {
          jobId: data.jobId,
          jobType: data.jobType,
          runtimeMs: data.runtimeMs,
          retryCount: data.retryCount,
          queueDelayMs: data.queueDelayMs,
          success: data.success,
        },
      });
      const { MetricsEngine } = await import("./MetricsEngine");
      const metrics = new MetricsEngine();
      await metrics.record("scheduler.runtime_ms", data.runtimeMs, { jobType: data.jobType });
      await metrics.record("scheduler.queue_delay_ms", data.queueDelayMs, { jobType: data.jobType });
      if (!data.success) await metrics.record("scheduler.failure_rate", 1, { jobType: data.jobType });
    } catch {
      /* metrics optional when schema unavailable */
    }
  }
}
