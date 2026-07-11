import { prisma } from "@/lib/auth/session";
import { arenaAnalytics } from "@/lib/arena/ArenaAnalytics";
import { METRIC_CATALOG } from "@/lib/telemetry/schema";
import { getTraceContext } from "@/lib/tracing/context";
import { logger } from "@/lib/logging";
import type {
  IAnalyticsEngine,
  IAnomalyEngine,
  IAlertEngine,
  IInsightEngine,
  IMetricsEngine,
  IObservabilityEngine,
  ITelemetryEngine,
} from "../interfaces";

export class MetricsEngine implements IMetricsEngine {
  name = "MetricsEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async record(name: string, value: number, tags?: Record<string, unknown>): Promise<void> {
    await prisma().metricSeries.create({ data: { name, value, tags: tags ?? undefined } });
  }

  async query(name: string, since: Date, until = new Date()): Promise<Record<string, unknown>[]> {
    const rows = await prisma().metricSeries.findMany({
      where: { name, recordedAt: { gte: since, lte: until } },
      orderBy: { recordedAt: "asc" },
    });
    return rows.map((r) => ({ value: r.value, tags: r.tags, recordedAt: r.recordedAt }));
  }

  async percentile(name: string, since: Date, p: number): Promise<number> {
    const rows = await this.query(name, since);
    if (!rows.length) return 0;
    const values = rows.map((r) => r.value as number).sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, idx)] ?? 0;
  }

  getCatalog(): Record<string, string> {
    return METRIC_CATALOG;
  }
}

export class TelemetryEngine implements ITelemetryEngine {
  name = "TelemetryEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async emit(source: string, eventType: string, payload?: Record<string, unknown>, durationMs?: number): Promise<void> {
    const ctx = getTraceContext();
    await prisma().telemetryEvent.create({
      data: {
        source,
        eventType,
        traceId: ctx?.traceId,
        spanId: ctx?.spanId,
        parentSpanId: ctx?.parentSpanId,
        correlationId: ctx?.correlationId,
        durationMs,
        payload: payload ?? undefined,
      },
    });
  }

  async list(filter?: { source?: string; traceId?: string; limit?: number }): Promise<Record<string, unknown>[]> {
    const rows = await prisma().telemetryEvent.findMany({
      where: {
        ...(filter?.source ? { source: filter.source } : {}),
        ...(filter?.traceId ? { traceId: filter.traceId } : {}),
      },
      orderBy: { recordedAt: "desc" },
      take: filter?.limit ?? 100,
    });
    return rows as unknown as Record<string, unknown>[];
  }
}

export class AnalyticsEngine implements IAnalyticsEngine {
  name = "AnalyticsEngine";
  private metrics = new MetricsEngine();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async collectProductMetrics(): Promise<Record<string, unknown>> {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;

    const [dau, wau, mau, arenaMatches, missionCompletions, spins, referrals, achievements, pendingRewards, queueSize] =
      await Promise.all([
        prisma().userProfile.count({ where: { lastLogin: { gte: new Date(now.getTime() - day) } } }),
        prisma().userProfile.count({ where: { lastLogin: { gte: new Date(now.getTime() - week) } } }),
        prisma().userProfile.count({ where: { lastLogin: { gte: new Date(now.getTime() - month) } } }),
        prisma().arenaMatch.count({ where: { createdAt: { gte: new Date(now.getTime() - week) } } }),
        prisma().userMission.count({ where: { completed: true, updatedAt: { gte: new Date(now.getTime() - week) } } }),
        prisma().spinHistory.count({ where: { createdAt: { gte: new Date(now.getTime() - week) } } }),
        prisma().referral.count({ where: { createdAt: { gte: new Date(now.getTime() - month) } } }),
        prisma().userAchievement.count({ where: { unlocked: true, unlockedAt: { gte: new Date(now.getTime() - month) } } }),
        prisma().pendingReward.count({ where: { status: "PENDING" } }),
        prisma().arenaQueue.count({ where: { status: { in: ["SEARCHING", "MATCHED"] } } }),
      ]);

    const arenaSummary = await arenaAnalytics.getSummary(new Date(now.getTime() - week));
    const retention = mau > 0 ? dau / mau : 0;

    await Promise.all([
      this.metrics.record("users.dau", dau),
      this.metrics.record("users.wau", wau),
      this.metrics.record("users.mau", mau),
      this.metrics.record("users.retention", retention),
      this.metrics.record("arena.participation", arenaMatches),
      this.metrics.record("missions.completion", missionCompletions),
      this.metrics.record("spins.engagement", spins),
      this.metrics.record("referrals.conversion", referrals),
      this.metrics.record("rewards.pending", pendingRewards),
      this.metrics.record("arena.queue_size", queueSize),
    ]);

    return {
      dau,
      wau,
      mau,
      retention,
      arena: { matchesWeek: arenaMatches, metrics: arenaSummary, queueSize },
      engagement: { missionCompletions, spins, referrals, achievements },
      rewards: { pending: pendingRewards },
    };
  }

  async snapshotDaily(): Promise<Record<string, unknown>> {
    const metrics = await this.collectProductMetrics();
    const row = await prisma().dashboardSnapshot.create({ data: { snapshot: metrics as object } });
    return { id: row.id, capturedAt: row.capturedAt };
  }
}

export class AlertEngine implements IAlertEngine {
  name = "AlertEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async listRules(): Promise<Record<string, unknown>[]> {
    return prisma().alertRule.findMany({ orderBy: { createdAt: "desc" } });
  }

  async upsertRule(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (data.id) {
      const row = await prisma().alertRule.update({
        where: { id: data.id as string },
        data: {
          name: String(data.name),
          metricName: String(data.metricName),
          condition: String(data.condition ?? "gt"),
          threshold: Number(data.threshold),
          severity: (data.severity as any) ?? "MEDIUM",
          enabled: data.enabled !== false,
        },
      });
      return row as unknown as Record<string, unknown>;
    }
    const row = await prisma().alertRule.create({
      data: {
        name: String(data.name),
        metricName: String(data.metricName),
        condition: String(data.condition ?? "gt"),
        threshold: Number(data.threshold),
        severity: (data.severity as any) ?? "MEDIUM",
        enabled: data.enabled !== false,
      },
    });
    return row as unknown as Record<string, unknown>;
  }

  async listIncidents(status?: string): Promise<Record<string, unknown>[]> {
    return prisma().alertIncident.findMany({
      where: status ? { status: status as any } : undefined,
      include: { rule: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }) as unknown as Record<string, unknown>[];
  }

  async acknowledge(incidentId: string, wallet: string): Promise<Record<string, unknown>> {
    const row = await prisma().alertIncident.update({
      where: { id: incidentId },
      data: { status: "ACKNOWLEDGED", acknowledgedBy: wallet, acknowledgedAt: new Date() },
    });
    return row as unknown as Record<string, unknown>;
  }

  async evaluateRules(): Promise<Record<string, unknown>[]> {
    const rules = await prisma().alertRule.findMany({ where: { enabled: true } });
    const created: Record<string, unknown>[] = [];

    for (const rule of rules) {
      if (rule.silenceUntil && rule.silenceUntil > new Date()) continue;

      const latest = await prisma().metricSeries.findFirst({
        where: { name: rule.metricName },
        orderBy: { recordedAt: "desc" },
      });
      if (!latest) continue;

      const triggered =
        (rule.condition === "gt" && latest.value > rule.threshold) ||
        (rule.condition === "lt" && latest.value < rule.threshold) ||
        (rule.condition === "eq" && latest.value === rule.threshold);

      if (!triggered) continue;

      const open = await prisma().alertIncident.findFirst({
        where: { ruleId: rule.id, status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      });
      if (open) continue;

      const incident = await prisma().alertIncident.create({
        data: {
          ruleId: rule.id,
          severity: rule.severity,
          message: `${rule.name}: ${rule.metricName}=${latest.value} ${rule.condition} ${rule.threshold}`,
          value: latest.value,
        },
      });
      created.push(incident as unknown as Record<string, unknown>);
      logger.warn("Alert incident created", { rule: rule.name, value: latest.value });
    }
    return created;
  }
}

export class InsightEngine implements IInsightEngine {
  name = "InsightEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async generate(): Promise<Record<string, unknown>[]> {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const insights: Array<{ category: string; title: string; body: string; trendPct?: number; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }> = [];

    const compare = async (name: string, label: string, category: string) => {
      const today = await prisma().metricSeries.findMany({
        where: { name, recordedAt: { gte: new Date(now.getTime() - day) } },
      });
      const yesterday = await prisma().metricSeries.findMany({
        where: { name, recordedAt: { gte: new Date(now.getTime() - 2 * day), lt: new Date(now.getTime() - day) } },
      });
      const todayAvg = today.length ? today.reduce((s, r) => s + r.value, 0) / today.length : 0;
      const yesterdayAvg = yesterday.length ? yesterday.reduce((s, r) => s + r.value, 0) / yesterday.length : 0;
      if (yesterdayAvg === 0) return;
      const trendPct = ((todayAvg - yesterdayAvg) / yesterdayAvg) * 100;
      if (Math.abs(trendPct) < 5) return;
      insights.push({
        category,
        title: `${label} ${trendPct > 0 ? "increased" : "dropped"} ${Math.abs(trendPct).toFixed(0)}% today`,
        body: `${label} moved from ${yesterdayAvg.toFixed(1)} to ${todayAvg.toFixed(1)} over the last 24h.`,
        trendPct,
        severity: Math.abs(trendPct) > 20 ? "HIGH" : "MEDIUM",
      });
    };

    await compare("missions.completion", "Mission completion", "engagement");
    await compare("arena.queue_size", "Arena queue size", "arena");
    await compare("spins.engagement", "Spin engagement", "engagement");

    const saved: Record<string, unknown>[] = [];
    for (const i of insights) {
      const row = await prisma().insight.create({ data: i });
      saved.push(row as unknown as Record<string, unknown>);
    }
    return saved;
  }

  async list(limit = 50): Promise<Record<string, unknown>[]> {
    return prisma().insight.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  }
}

export class AnomalyEngine implements IAnomalyEngine {
  name = "AnomalyEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  detect(values: number[], threshold = 2): { index: number; value: number; zScore: number }[] {
    if (values.length < 3) return [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance) || 1;
    return values
      .map((value, index) => ({ index, value, zScore: (value - mean) / std }))
      .filter((p) => Math.abs(p.zScore) >= threshold);
  }

  async scanMetric(name: string, windowHours = 24, threshold = 2): Promise<Record<string, unknown>> {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const rows = await prisma().metricSeries.findMany({
      where: { name, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
    });
    const values = rows.map((r) => r.value);
    const anomalies = this.detect(values, threshold);
    return { metric: name, sampleSize: values.length, anomalies, movingAverage: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0 };
  }
}

export class ObservabilityEngine implements IObservabilityEngine {
  name = "ObservabilityEngine";
  private analytics = new AnalyticsEngine();
  private alerts = new AlertEngine();
  private metrics = new MetricsEngine();

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getDashboard(): Promise<Record<string, unknown>> {
    const [product, health, incidents, schedulerMetrics, dependencies] = await Promise.all([
      this.analytics.collectProductMetrics(),
      this.checkHealth(),
      this.alerts.listIncidents("OPEN"),
      prisma().schedulerMetric.findMany({ orderBy: { recordedAt: "desc" }, take: 20 }),
      prisma().serviceDependency.findMany(),
    ]);

    return { product, health, openAlerts: incidents.length, schedulerMetrics, dependencies };
  }

  async checkHealth(): Promise<Record<string, unknown>> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [dbCheck, pendingJobs, deadLetter, queueSize, pendingRewards, liveEvents, enabledFlags] = await Promise.all([
      prisma().userProfile.count().then(() => true).catch(() => false),
      prisma().scheduledJob.count({ where: { status: "PENDING" } }),
      prisma().scheduledJob.count({ where: { status: "DEAD_LETTER" } }),
      prisma().arenaQueue.count({ where: { status: { in: ["SEARCHING", "MATCHED"] } } }),
      prisma().pendingReward.count({ where: { status: "PENDING" } }),
      prisma().liveEvent.count({ where: { status: "ACTIVE" } }),
      prisma().featureFlag.count({ where: { enabled: true } }),
    ]);

    const components = [
      { component: "database", status: dbCheck ? "HEALTHY" : "UNHEALTHY", latencyMs: 5 },
      { component: "scheduler", status: deadLetter > 0 ? "DEGRADED" : "HEALTHY", metadata: { pendingJobs, deadLetter } },
      { component: "arena_queue", status: queueSize > 100 ? "DEGRADED" : "HEALTHY", metadata: { queueSize } },
      { component: "settlement_queue", status: pendingRewards > 50 ? "DEGRADED" : "HEALTHY", metadata: { pendingRewards } },
      { component: "live_events", status: "HEALTHY", metadata: { liveEvents } },
      { component: "feature_flags", status: "HEALTHY", metadata: { enabledFlags } },
    ];

    for (const c of components) {
      await prisma().systemHealth.create({
        data: {
          component: c.component,
          status: c.status as any,
          latencyMs: c.latencyMs,
          metadata: c.metadata as object,
        },
      });
    }

    const apiLatency = await this.metrics.percentile("api.latency_ms", dayAgo, 95);
    const overall = components.some((c) => c.status === "UNHEALTHY")
      ? "UNHEALTHY"
      : components.some((c) => c.status === "DEGRADED")
        ? "DEGRADED"
        : "HEALTHY";

    return { status: overall, components, apiP95Ms: apiLatency, checkedAt: now };
  }

  async recordSpan(span: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operation: string;
    service: string;
    durationMs: number;
    status: string;
    metadata?: Record<string, unknown>;
    startedAt: Date;
  }): Promise<void> {
    await prisma().traceSpan.create({ data: { ...span, metadata: span.metadata as object } });
  }

  async getTrace(traceId: string): Promise<Record<string, unknown>[]> {
    return prisma().traceSpan.findMany({ where: { traceId }, orderBy: { startedAt: "asc" } });
  }

  async seedDependencies(): Promise<void> {
    const deps = [
      { service: "api", dependsOn: "database", critical: true },
      { service: "api", dependsOn: "scheduler", critical: false },
      { service: "arena", dependsOn: "database", critical: true },
      { service: "rewards", dependsOn: "blockchain", critical: true },
      { service: "rewards", dependsOn: "database", critical: true },
      { service: "admin", dependsOn: "api", critical: true },
    ];
    for (const d of deps) {
      await prisma().serviceDependency.upsert({
        where: { service_dependsOn: { service: d.service, dependsOn: d.dependsOn } },
        update: { critical: d.critical },
        create: d,
      });
    }
  }
}

export class GlobalSearchEngine {
  name = "GlobalSearchEngine";

  async search(query: string, limit = 20): Promise<Record<string, unknown>> {
    const q = query.trim();
    if (!q) return { results: [] };

    const [users, seasons, campaigns, flags, rewards, audit, matches] = await Promise.all([
      prisma().userProfile.findMany({
        where: { OR: [{ wallet: { contains: q, mode: "insensitive" } }, { username: { contains: q, mode: "insensitive" } }] },
        take: limit,
        select: { id: true, wallet: true, username: true, status: true },
      }),
      prisma().season.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }] },
        take: limit,
        select: { id: true, number: true, name: true, status: true },
      }),
      prisma().campaign.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        take: limit,
        select: { id: true, name: true, status: true },
      }),
      prisma().featureFlag.findMany({
        where: { key: { contains: q, mode: "insensitive" } },
        take: limit,
        select: { id: true, key: true, enabled: true },
      }),
      prisma().pendingReward.findMany({
        where: { userId: { contains: q } },
        take: limit,
        select: { id: true, userId: true, status: true, amount: true },
      }),
      prisma().auditLog.findMany({
        where: { OR: [{ action: { contains: q, mode: "insensitive" } }, { entity: { contains: q, mode: "insensitive" } }, { actor: { contains: q, mode: "insensitive" } }] },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, action: true, entity: true, actor: true, createdAt: true },
      }),
      prisma().arenaMatch.findMany({
        where: { id: { contains: q } },
        take: limit,
        select: { id: true, status: true, createdAt: true },
      }),
    ]);

    return {
      query: q,
      results: [
        ...users.map((u) => ({ type: "user", ...u })),
        ...seasons.map((s) => ({ type: "season", ...s })),
        ...campaigns.map((c) => ({ type: "campaign", ...c })),
        ...flags.map((f) => ({ type: "feature_flag", ...f })),
        ...rewards.map((r) => ({ type: "reward", ...r })),
        ...audit.map((a) => ({ type: "audit", ...a })),
        ...matches.map((m) => ({ type: "arena_match", ...m })),
      ],
    };
  }
}

export class ExperimentAnalyticsEngine {
  name = "ExperimentAnalyticsEngine";

  async record(flagKey: string, variant: string, metricName: string, value: number, sampleSize = 1): Promise<void> {
    await prisma().experimentResult.create({ data: { flagKey, variant, metricName, value, sampleSize } });
  }

  async compare(flagKey: string): Promise<Record<string, unknown>> {
    const rows = await prisma().experimentResult.findMany({
      where: { flagKey },
      orderBy: { recordedAt: "desc" },
      take: 500,
    });

    const byVariant: Record<string, Record<string, { total: number; count: number }>> = {};
    for (const r of rows) {
      byVariant[r.variant] ??= {};
      byVariant[r.variant][r.metricName] ??= { total: 0, count: 0 };
      byVariant[r.variant][r.metricName].total += r.value;
      byVariant[r.variant][r.metricName].count += 1;
    }

    const summary: Record<string, unknown> = {};
    for (const [variant, metrics] of Object.entries(byVariant)) {
      summary[variant] = Object.fromEntries(
        Object.entries(metrics).map(([k, v]) => [k, { avg: v.count ? v.total / v.count : 0, samples: v.count }])
      );
    }
    return { flagKey, variants: summary, sampleSize: rows.length };
  }
}
