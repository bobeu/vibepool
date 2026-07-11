import { prisma } from "@/lib/auth/session";
import { eventBus } from "@/services/engines/EventBus";

export type ArenaMetricType =
  | "QUEUE_TIME_MS"
  | "RATING_DIFF"
  | "MATCH_DURATION_MS"
  | "WIN_RATE"
  | "COMPLETION_RATE"
  | "ABANDONMENT_RATE"
  | "REMATCH_RATE"
  | "INVITE_ACCEPTANCE_RATE";

export class ArenaAnalytics {
  async record(metricType: ArenaMetricType, value: number, metadata?: Record<string, unknown>): Promise<void> {
    await prisma().arenaAnalyticsMetric.create({
      data: { metricType, value, metadata: metadata ?? undefined },
    });

    eventBus.publish({
      event: "ArenaMetricRecorded",
      aggregateType: "ArenaAnalytics",
      metricType,
      value,
      metadata,
    });
  }

  async getSummary(since?: Date): Promise<Record<string, number>> {
    const where = since ? { recordedAt: { gte: since } } : {};
    const metrics = await prisma().arenaAnalyticsMetric.findMany({ where, orderBy: { recordedAt: "desc" }, take: 5000 });

    const grouped: Record<string, { sum: number; count: number }> = {};
    for (const m of metrics) {
      if (!grouped[m.metricType]) grouped[m.metricType] = { sum: 0, count: 0 };
      grouped[m.metricType].sum += m.value;
      grouped[m.metricType].count += 1;
    }

    const summary: Record<string, number> = {};
    for (const [type, { sum, count }] of Object.entries(grouped)) {
      summary[type] = count > 0 ? sum / count : 0;
    }
    return summary;
  }
}

export const arenaAnalytics = new ArenaAnalytics();
