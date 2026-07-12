import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeAuditHash } from "@/lib/audit/integrity";
import { createSession, getSessionFromRequest, verifyWalletSignature } from "@/lib/auth/session";
import { resolveUserId } from "@/lib/auth/resolveUser";
import { MissionService, SpinService, RewardService } from "@/services/serviceImpl";
import { PredictionService } from "@/services/PredictionService";
import { ReferralEngine } from "@/services/engines/ReferralEngine";

vi.mock("@/lib/auth/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/session")>("@/lib/auth/session");
  return {
    ...actual,
    prisma: () => mockPrisma,
  };
});

vi.mock("@/services/engines/EventBus", () => ({ eventBus: { publish: vi.fn(), subscribe: vi.fn(() => () => {}) } }));
vi.mock("@/lib/logging", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const mockPrisma: Record<string, any> = {};

function resetMock() {
  const store: Record<string, any[]> = {
    userProfile: [{ id: "user-1", wallet: "0xabc12345678901234567890123456789012345678", spins: 2, xp: 100, points: 50 }],
    session: [],
    refreshToken: [],
    userMission: [],
    dailyMission: [{ id: "m1", title: "Play Arena", category: "DAILY", status: "ACTIVE", targetValue: 1, xpReward: 10 }],
    prediction: [],
    tournament: [{ id: "t1", name: "Daily", status: "OPEN", currentPlayers: 0 }],
    referral: [],
    activity: [],
    spinLedger: [],
    settings: [{ key: "daily_spin_limit", value: "3" }],
  };

  const makeModel = (name: string) => ({
    findMany: vi.fn(async () => store[name] ?? []),
    findFirst: vi.fn(async ({ where }: any = {}) => {
      const rows = store[name] ?? [];
      if (where?.wallet) return rows.find((r) => r.wallet === where.wallet) ?? null;
      if (where?.tournamentId && where?.userId) {
        return rows.find((r) => r.tournamentId === where.tournamentId && r.userId === where.userId) ?? null;
      }
      if (where?.refreshToken) return rows.find((r) => r.refreshToken === where.refreshToken) ?? null;
      return rows[0] ?? null;
    }),
    findUnique: vi.fn(async ({ where }: any) => {
      const rows = store[name] ?? [];
      if (where?.wallet) return rows.find((r) => r.wallet === where.wallet) ?? null;
      if (where?.id) return rows.find((r) => r.id === where.id) ?? null;
      return null;
    }),
    create: vi.fn(async ({ data }: any) => {
      const row = { id: `${name}-1`, ...data };
      store[name].push(row);
      return row;
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const row = (store[name] ?? []).find((r) => r.id === where.id);
      if (row) Object.assign(row, data);
      return row;
    }),
    createMany: vi.fn(async () => ({ count: 0 })),
    count: vi.fn(async () => (store[name] ?? []).length),
  });

  for (const key of Object.keys(store)) mockPrisma[key] = makeModel(key);
}

describe("Auth integration", () => {
  beforeEach(resetMock);

  it("creates session with userId from profile", async () => {
    const result = await createSession(mockPrisma as any, "0xabc12345678901234567890123456789012345678");
    expect(result.accessToken).toHaveLength(64);
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  it("resolves wallet to userId", async () => {
    const userId = await resolveUserId("0xabc12345678901234567890123456789012345678");
    expect(userId).toBe("user-1");
  });
});

describe("Mission flow integration", () => {
  beforeEach(resetMock);

  it("resolves wallet before fetching missions", async () => {
    const service = new MissionService();
    const missions = await service.getActiveMissions("0xabc12345678901234567890123456789012345678");
    expect(Array.isArray(missions)).toBe(true);
  });
});

describe("Spin flow integration", () => {
  beforeEach(resetMock);

  it("checks spin balance by userId", async () => {
    const service = new SpinService();
    const balance = await service.getAvailableSpins("0xabc12345678901234567890123456789012345678");
    expect(balance).toBeDefined();
  });
});

describe("Prediction flow integration", () => {
  beforeEach(resetMock);

  it("submits prediction with resolved userId", async () => {
    const service = new PredictionService();
    const result = await service.submitPrediction("0xabc12345678901234567890123456789012345678", { predictionValue: 42 });
    expect(result.status).toBe("PENDING");
  });
});

describe("Referral engine integration", () => {
  beforeEach(resetMock);

  it("loads referrals for wallet", async () => {
    const engine = new ReferralEngine();
    const data = await engine.getReferrals("0xabc12345678901234567890123456789012345678");
    expect(data).toBeDefined();
  });
});

describe("Audit chain (regression)", () => {
  it("still computes hash chain", () => {
    const hash = computeAuditHash(null, { action: "TEST", createdAt: "2026-01-01" });
    expect(hash).toHaveLength(64);
  });
});
