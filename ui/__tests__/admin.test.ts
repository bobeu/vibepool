import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasPermission, permissionFor } from "@/lib/admin/permissions";
import { enrichEvent, createEventMetadata } from "@/lib/events/metadata";
import { CampaignEngine } from "@/services/engines/CampaignEngine";
import { SchedulerEngine } from "@/services/engines/SchedulerEngine";
import { FeatureFlagEngine } from "@/services/engines/FeatureFlagEngine";

vi.mock("@/lib/auth/session", () => ({ prisma: () => mockPrisma }));
vi.mock("@/services/engines/EventBus", () => ({ eventBus: { publish: vi.fn(), subscribe: vi.fn(() => () => {}) } }));
vi.mock("@/lib/logging", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const mockPrisma: Record<string, any> = {};

function resetMock() {
  const store: Record<string, any[]> = {
    campaign: [],
    campaignVersion: [],
    campaignTarget: [],
    scheduledJob: [],
    scheduledJobDependency: [],
    featureFlag: [{ id: "f1", key: "arena", enabled: true, targetType: "EXPERIMENT", experimentGroups: { A: 34, B: 33, C: 33 }, minipayOnly: false }],
  };

  const makeModel = (name: string) => ({
    findMany: vi.fn(async ({ where, include, orderBy, take }: any) => {
      let rows = [...(store[name] ?? [])];
      if (where?.status) rows = rows.filter((r) => r.status === where.status);
      if (where?.key) rows = rows.filter((r) => r.key === where.key);
      if (where?.scheduledAt?.lte) rows = rows.filter((r) => r.scheduledAt <= where.scheduledAt.lte);
      if (where?.paused === false) rows = rows.filter((r) => !r.paused);
      if (orderBy?.scheduledAt === "asc") rows.sort((a, b) => (a.scheduledAt?.getTime?.() ?? 0) - (b.scheduledAt?.getTime?.() ?? 0));
      if (take) rows = rows.slice(0, take);
      if (include?.dependencies) {
        rows = rows.map((r) => ({
          ...r,
          dependencies: (store.scheduledJobDependency ?? [])
            .filter((d: any) => d.jobId === r.id)
            .map((d: any) => ({ dependsOnJobId: d.dependsOnJobId, dependsOn: (store.scheduledJob ?? []).find((j: any) => j.id === d.dependsOnJobId) ?? { status: "COMPLETED" } })),
        }));
      }
      return rows;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const rows = store[name] ?? [];
      if (where.id) return rows.find((r) => r.id === where.id) ?? null;
      if (where.key) return rows.find((r) => r.key === where.key) ?? null;
      if (where.campaignId_version) {
        return rows.find((r) => r.campaignId === where.campaignId_version.campaignId && r.version === where.campaignId_version.version) ?? null;
      }
      if (where.idempotencyKey) return rows.find((r) => r.idempotencyKey === where.idempotencyKey) ?? null;
      return null;
    }),
    findFirst: vi.fn(async () => store[name]?.[0] ?? null),
    create: vi.fn(async ({ data }: any) => {
      const row = { id: `${name}-${Date.now()}`, status: "PENDING", retryCount: 0, maxRetries: 3, paused: false, version: 1, ...data };
      store[name].push(row);
      return row;
    }),
    createMany: vi.fn(async ({ data }: any) => {
      for (const item of data) store[name].push({ id: `${name}-${Date.now()}`, ...item });
      return { count: data.length };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const row = (store[name] ?? []).find((r) => r.id === where.id);
      if (!row) return null;
      if (data.version?.increment) row.version = (row.version ?? 1) + data.version.increment;
      else Object.assign(row, data);
      return row;
    }),
    updateMany: vi.fn(async () => ({ count: 0 })),
    deleteMany: vi.fn(async () => ({ count: 0 })),
    count: vi.fn(async () => (store[name] ?? []).length),
  });

  for (const key of Object.keys(store)) mockPrisma[key] = makeModel(key);
}

describe("Admin permissions", () => {
  it("grants super admin wildcard", () => {
    expect(hasPermission("SUPER_ADMIN", "users:write")).toBe(true);
  });

  it("restricts support to moderation and users", () => {
    expect(hasPermission("SUPPORT", "moderation:write")).toBe(true);
    expect(hasPermission("SUPPORT", "campaigns:write")).toBe(false);
  });

  it("builds resource permissions", () => {
    expect(permissionFor("audit", "read")).toBe("audit:read");
  });
});

describe("Event metadata", () => {
  it("enriches domain events", () => {
    const enriched = enrichEvent({ event: "TestEvent" });
    expect(enriched.correlationId).toBeDefined();
    expect(enriched.requestId).toBeDefined();
    expect(enriched.environment).toBeDefined();
    expect(enriched.timestamp).toBeDefined();
  });

  it("creates metadata with overrides", () => {
    const meta = createEventMetadata({ region: "eu-west" });
    expect(meta.region).toBe("eu-west");
  });
});

describe("Prompt 12 fixes", () => {
  beforeEach(() => {
    resetMock();
    vi.clearAllMocks();
  });

  it("supports campaign pause and clone", async () => {
    const engine = new CampaignEngine();
    const created = await engine.createCampaign({ name: "Test", type: "RETENTION" });
    await engine.pauseCampaign(created.id as string);
    const clone = await engine.cloneCampaign(created.id as string, "0xAdmin");
    expect(clone.clonedFrom).toBe(created.id);
  });

  it("dry runs scheduler jobs", async () => {
    const engine = new SchedulerEngine();
    engine.registerHandler("CLEANUP", async (_p, opts) => (opts?.dryRun ? { simulated: true } : { ok: true }));
    const scheduled = await engine.schedule("CLEANUP", new Date(Date.now() - 1000));
    const result = await engine.dryRunJob(scheduled.id as string);
    expect(result.dryRun).toBe(true);
    expect(result.status).toBe("DRY_RUN");
  });

  it("evaluates experiment groups", async () => {
    const engine = new FeatureFlagEngine();
    const result = await engine.evaluate("arena", { wallet: "0xABCDEF123456789012345678901234567890ABCD" });
    expect(result.key).toBe("arena");
    expect(result).toHaveProperty("enabled");
  });
});
