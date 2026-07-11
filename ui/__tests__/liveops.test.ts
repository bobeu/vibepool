import { describe, it, expect, vi, beforeEach } from "vitest";
import { SeasonEngine } from "@/services/engines/SeasonEngine";
import { FeatureFlagEngine } from "@/services/engines/FeatureFlagEngine";
import { ContentEngine } from "@/services/engines/ContentEngine";
import { CampaignEngine } from "@/services/engines/CampaignEngine";
import { SchedulerEngine } from "@/services/engines/SchedulerEngine";
import { ArenaStateMachine } from "@/lib/arena/ArenaStateMachine";
import { QueueSimulator } from "@/lib/arena/QueueSimulator";
import { compressReplay, decompressReplay } from "@/lib/arena/replayCompression";
import { RatingStrategyRegistry } from "@/services/engines/rating/RatingStrategyRegistry";

vi.mock("@/lib/auth/session", () => ({
  prisma: () => mockPrisma,
}));

vi.mock("@/services/engines/EventBus", () => ({
  eventBus: { publish: vi.fn(), subscribe: vi.fn(() => () => {}) },
}));

vi.mock("@/lib/logging", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma: Record<string, any> = {};

function resetMock() {
  const store: Record<string, any[]> = {
    season: [
      {
        id: "s1",
        number: 1,
        name: "Season 1",
        status: "ACTIVE",
        startAt: new Date("2026-01-01"),
        endAt: new Date("2026-12-31"),
      },
    ],
    seasonTier: [{ id: "t1", seasonId: "s1", tierLevel: 1, name: "Bronze", xpRequired: 100 }],
    seasonProgress: [],
    featureFlag: [
      { id: "f1", key: "arena", enabled: true, targetType: "GLOBAL", percentage: null, whitelist: null, minipayOnly: false, environments: null },
    ],
    contentBlock: [],
    campaign: [],
    campaignVersion: [],
    campaignTarget: [],
    scheduledJob: [],
    userProfile: [{ id: "u1", wallet: "0xA" }],
  };

  const makeModel = (name: string) => ({
    findFirst: vi.fn(async ({ where, orderBy }: any) => {
      let rows = [...(store[name] ?? [])];
      if (where?.status) rows = rows.filter((r) => r.status === where.status);
      if (orderBy?.number === "desc") return rows.sort((a, b) => b.number - a.number)[0] ?? null;
      return rows[0] ?? null;
    }),
    findMany: vi.fn(async ({ where, orderBy, take }: any) => {
      let rows = [...(store[name] ?? [])];
      if (where?.status) rows = rows.filter((r) => r.status === where.status);
      if (where?.scheduledAt?.lte) {
        rows = rows.filter((r) => r.scheduledAt && r.scheduledAt <= where.scheduledAt.lte);
      }
      if (where?.paused === false) rows = rows.filter((r) => !r.paused);
      if (orderBy?.scheduledAt === "asc") rows.sort((a, b) => (a.scheduledAt?.getTime?.() ?? 0) - (b.scheduledAt?.getTime?.() ?? 0));
      if (take) rows = rows.slice(0, take);
      return rows;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const rows = store[name] ?? [];
      if (where.number) return rows.find((r) => r.number === where.number) ?? null;
      if (where.key) return rows.find((r) => r.key === where.key) ?? null;
      if (where.id) return rows.find((r) => r.id === where.id) ?? null;
      if (where.idempotencyKey) return rows.find((r) => r.idempotencyKey === where.idempotencyKey) ?? null;
      if (where.id) return rows.find((r) => r.id === where.id) ?? null;
      if (where.campaignId_version) {
        return rows.find((r) => r.campaignId === where.campaignId_version.campaignId && r.version === where.campaignId_version.version) ?? null;
      }
      if (where.wallet) return rows.find((r) => r.wallet === where.wallet) ?? null;
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const row = { id: `${name}-${Date.now()}`, status: "PENDING", retryCount: 0, maxRetries: 3, ...data };
      store[name].push(row);
      return row;
    }),
    createMany: vi.fn(async ({ data }: any) => {
      for (const item of data) store[name].push({ id: `${name}-${Date.now()}`, ...item });
      return { count: data.length };
    }),
    upsert: vi.fn(async ({ where, create, update }: any) => {
      const rows = store[name] ?? [];
      let row = null;
      if (where.userId_seasonId) {
        row = rows.find((r) => r.userId === where.userId_seasonId.userId && r.seasonId === where.userId_seasonId.seasonId);
      }
      if (where.key) row = rows.find((r) => r.key === where.key);
      if (!row) {
        row = { id: `${name}-${Date.now()}`, ...create };
        rows.push(row);
      } else if (update) Object.assign(row, update);
      return row;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const row = (store[name] ?? []).find((r) => r.id === where.id);
      if (row) Object.assign(row, data);
      return row;
    }),
    updateMany: vi.fn(async () => ({ count: 0 })),
    count: vi.fn(async () => (store[name] ?? []).length),
  });

  for (const key of Object.keys(store)) {
    mockPrisma[key] = makeModel(key);
  }
}

describe("LiveOps", () => {
  beforeEach(() => {
    resetMock();
    vi.clearAllMocks();
  });

  it("returns active season", async () => {
    const engine = new SeasonEngine();
    const season = await engine.getActiveSeason();
    expect(season.number).toBe(1);
    expect(season.name).toBe("Season 1");
  });

  it("resolves feature flags globally", async () => {
    const engine = new FeatureFlagEngine();
    expect(await engine.isEnabled("arena", { wallet: "0xA" })).toBe(true);
  });

  it("returns fallback hero when no content blocks", async () => {
    const engine = new ContentEngine();
    const hero = await engine.getHeroBanner();
    expect(hero?.fallback).toBe(true);
  });

  it("creates campaigns", async () => {
    const engine = new CampaignEngine();
    const campaign = await engine.createCampaign({ name: "Launch", type: "RETENTION" });
    expect(campaign.name).toBe("Launch");
  });

  it("runs scheduled jobs with registered handler", async () => {
    const engine = new SchedulerEngine();
    engine.registerHandler("CLEANUP", async () => ({ ok: true }));
    const scheduled = await engine.schedule("CLEANUP", new Date(Date.now() - 1000));
    const results = await engine.runDueJobs();
    expect(results[0]?.status).toBe("COMPLETED");
    expect(scheduled.id).toBeDefined();
  });
});

describe("Arena improvements", () => {
  it("transitions match lifecycle via state machine", () => {
    const sm = new ArenaStateMachine("WAITING");
    expect(sm.transition("ALL_ACCEPTED")).toBe("COUNTDOWN");
    expect(sm.transition("COUNTDOWN_DONE")).toBe("PLAYING");
    expect(sm.transition("SUBMIT_PREDICTIONS")).toBe("FINISHED");
    expect(sm.transition("FINALIZE")).toBe("SETTLING");
    expect(sm.transition("SETTLE")).toBe("COMPLETED");
  });

  it("simulates queue at scale", () => {
    const sim = new QueueSimulator();
    const bench = sim.runBenchmark();
    expect(bench["10"].playerCount).toBe(10);
    expect(bench["10000"].playerCount).toBe(10000);
  });

  it("compresses and decompresses replays", () => {
    const payload = { timeline: [{ event: "START" }, { event: "PREDICTION" }], statistics: { target: 1000 } };
    const compressed = compressReplay(payload);
    expect(compressed.compressed).toBe(true);
    expect(compressed.checkpoints?.length).toBeGreaterThan(0);
    const restored = decompressReplay(compressed);
    expect(restored.timeline).toHaveLength(2);
  });

  it("lists rating strategies", () => {
    const strategies = RatingStrategyRegistry.list();
    expect(strategies).toContain("simple");
    expect(strategies).toContain("elo");
    expect(RatingStrategyRegistry.get("elo")).toBeDefined();
  });
});
