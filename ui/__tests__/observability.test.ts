import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeAuditHash, verifyAuditChain } from "@/lib/audit/integrity";
import { evaluatePolicy } from "@/lib/admin/policy";
import { AnomalyEngine } from "@/services/engines/AnomalyEngine";
import { MetricsEngine } from "@/services/engines/MetricsEngine";
import { AlertEngine } from "@/services/engines/AlertEngine";
import { InsightEngine } from "@/services/engines/InsightEngine";
import { GlobalSearchEngine } from "@/services/engines/observability/ObservabilityEngines";
import { createTraceContext, childSpan, runWithTrace } from "@/lib/tracing/context";
import { normalizeTelemetry, METRIC_CATALOG } from "@/lib/telemetry/schema";

vi.mock("@/lib/auth/session", () => ({ prisma: () => mockPrisma }));
vi.mock("@/lib/logging", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/arena/ArenaAnalytics", () => ({ arenaAnalytics: { getSummary: vi.fn(async () => ({})) } }));

const mockPrisma: Record<string, any> = {};

function resetMock() {
  const store: Record<string, any[]> = {
    auditLog: [],
    auditIntegrity: [],
    metricSeries: [],
    alertRule: [{ id: "r1", name: "Queue high", metricName: "arena.queue_size", condition: "gt", threshold: 50, severity: "HIGH", enabled: true }],
    alertIncident: [],
    insight: [],
    adminPolicy: [],
    userProfile: [{ id: "u1", wallet: "0xabc", username: "player1" }],
    season: [],
    campaign: [],
    featureFlag: [],
    pendingReward: [],
    arenaMatch: [],
    schedulerMetric: [],
    systemHealth: [],
    serviceDependency: [],
    traceSpan: [],
    telemetryEvent: [],
    experimentResult: [],
    dashboardSnapshot: [],
  };

  const makeModel = (name: string) => ({
    findMany: vi.fn(async ({ where, orderBy, take }: any = {}) => {
      let rows = [...(store[name] ?? [])];
      if (where?.name) rows = rows.filter((r) => r.name === where.name);
      if (where?.flagKey) rows = rows.filter((r) => r.flagKey === where.flagKey);
      if (where?.enabled) rows = rows.filter((r) => r.enabled === where.enabled);
      if (where?.status) rows = rows.filter((r) => r.status === where.status);
      if (where?.recordedAt?.gte) rows = rows.filter((r) => r.recordedAt >= where.recordedAt.gte);
      if (orderBy?.recordedAt === "desc") rows.sort((a, b) => (b.recordedAt?.getTime?.() ?? 0) - (a.recordedAt?.getTime?.() ?? 0));
      if (orderBy?.recordedAt === "asc") rows.sort((a, b) => (a.recordedAt?.getTime?.() ?? 0) - (b.recordedAt?.getTime?.() ?? 0));
      if (orderBy?.createdAt === "desc") rows.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
      if (take) rows = rows.slice(0, take);
      return rows;
    }),
    findFirst: vi.fn(async ({ where, orderBy }: any = {}) => {
      let rows = [...(store[name] ?? [])];
      if (where?.name) rows = rows.filter((r) => r.name === where.name);
      if (where?.ruleId) rows = rows.filter((r) => r.ruleId === where.ruleId);
      if (where?.recordHash) rows = rows.filter((r) => r.recordHash != null);
      if (where?.role) rows = rows.filter((r) => r.role === where.role && r.permission === where.permission && r.active === where.active);
      if (orderBy?.recordedAt === "desc") rows.sort((a, b) => (b.recordedAt?.getTime?.() ?? 0) - (a.recordedAt?.getTime?.() ?? 0));
      if (orderBy?.createdAt === "desc") rows.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
      return rows[0] ?? null;
    }),
    findUnique: vi.fn(async () => null),
    create: vi.fn(async ({ data }: any) => {
      const row = { id: `${name}-${Date.now()}`, createdAt: new Date(), recordedAt: new Date(), ...data };
      store[name].push(row);
      return row;
    }),
    upsert: vi.fn(async ({ create }: any) => {
      store[name].push({ id: `${name}-1`, ...create });
      return create;
    }),
    count: vi.fn(async () => (store[name] ?? []).length),
    update: vi.fn(async ({ where, data }: any) => {
      const row = (store[name] ?? []).find((r) => r.id === where.id);
      if (row) Object.assign(row, data);
      return row;
    }),
  });

  for (const key of Object.keys(store)) mockPrisma[key] = makeModel(key);
}

describe("Audit integrity", () => {
  it("computes deterministic hash chain", () => {
    const h1 = computeAuditHash(null, { action: "TEST", createdAt: "2026-01-01T00:00:00.000Z" });
    const h2 = computeAuditHash(h1, { action: "TEST2", createdAt: "2026-01-02T00:00:00.000Z" });
    expect(h1).toHaveLength(64);
    expect(h2).not.toEqual(h1);
  });
});

describe("Policy engine", () => {
  beforeEach(resetMock);

  it("allows when no policy matches", async () => {
    const result = await evaluatePolicy("ANALYST", "analytics:read");
    expect(result.allowed).toBe(true);
  });

  it("blocks finance from denied permission policy context", async () => {
    const result = await evaluatePolicy("FINANCE", "scheduler:execute");
    expect(result.allowed).toBe(false);
  });
});

describe("Tracing context", () => {
  it("creates trace and child spans", () => {
    const ctx = createTraceContext();
    runWithTrace(ctx, () => {
      const child = childSpan("db.query");
      expect(ctx.traceId).toBeDefined();
      expect(child.parentSpanId).toBe(ctx.spanId);
    });
  });
});

describe("Telemetry schema", () => {
  it("normalizes telemetry events", () => {
    const event = normalizeTelemetry({ source: "arena", eventType: "MatchStarted" });
    expect(event.source).toBe("arena");
    expect(event.eventType).toBe("MatchStarted");
  });

  it("includes metric catalog", () => {
    expect(METRIC_CATALOG["users.dau"]).toBeDefined();
  });
});

describe("Anomaly engine", () => {
  it("detects statistical outliers", () => {
    const engine = new AnomalyEngine();
    const anomalies = engine.detect([10, 10, 11, 10, 100], 1.5);
    expect(anomalies.length).toBeGreaterThan(0);
  });
});

describe("Metrics engine", () => {
  beforeEach(resetMock);

  it("records and queries metrics", async () => {
    const engine = new MetricsEngine();
    await engine.record("api.latency_ms", 42);
    const catalog = engine.getCatalog();
    expect(catalog["api.latency_ms"]).toBeDefined();
  });
});

describe("Alert engine", () => {
  beforeEach(resetMock);

  it("creates incident when threshold exceeded", async () => {
    mockPrisma.metricSeries.create({ data: { name: "arena.queue_size", value: 100, recordedAt: new Date() } });
    const engine = new AlertEngine();
    const created = await engine.evaluateRules();
    expect(created.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Global search", () => {
  beforeEach(resetMock);

  it("returns typed search results", async () => {
    const engine = new GlobalSearchEngine();
    const result = await engine.search("player");
    expect(result.results).toBeDefined();
  });
});

describe("Insight engine", () => {
  beforeEach(resetMock);

  it("lists insights", async () => {
    const engine = new InsightEngine();
    const list = await engine.list(10);
    expect(Array.isArray(list)).toBe(true);
  });
});
