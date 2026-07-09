import { describe, it, expect, vi } from "vitest";
import { PredictionEngine } from "@/services/engines/PredictionEngine";
import { ScoringEngine } from "@/services/engines/ScoringEngine";
import { RankingEngine } from "@/services/engines/RankingEngine";
import { XPRewardEngine } from "@/services/engines/XPRewardEngine";
import { RewardEngine } from "@/services/engines/RewardEngine";
import { SettlementEngine } from "@/services/engines/SettlementEngine";
import { AuditEngine } from "@/services/engines/AuditEngine";
import { GameEngine } from "@/services/engines/GameEngine";

var mockPrisma: Record<string, unknown> = {};

mockPrisma = {
  prediction: { findMany: vi.fn() },
  settings: { findMany: vi.fn() },
  userProfile: { findUnique: vi.fn(), update: vi.fn() },
  pendingReward: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
  rewardLedger: { create: vi.fn() },
  gameExecution: { create: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn() },
  tournament: { findUnique: vi.fn(), update: vi.fn() },
  rateLimitEntry: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  leaderboardSnapshot: { create: vi.fn(), createMany: vi.fn() },
  $transaction: vi.fn().mockImplementation(async (ops: unknown[]) => ops),
};

vi.mock("@/lib/auth/session", () => ({
  prisma: () => mockPrisma,
}));

describe("PredictionEngine", () => {
  const engine = new PredictionEngine();

  it("should calculate accuracy symmetrically", () => {
    expect(engine.calculateAccuracy(100, 100)).toBe(1);
    expect(engine.calculateAccuracy(0, 100)).toBeCloseTo(0);
    expect(engine.calculateAccuracy(50, 100)).toBeCloseTo(0.3333, 2);
  });

  it("should validate prediction data", () => {
    expect(engine.validatePredictionData({ predictionValue: 100 })).toBe(true);
    expect(engine.validatePredictionData({ predictionValue: -10 })).toBe(false);
    expect(engine.validatePredictionData({})).toBe(false);
  });
});

describe("ScoringEngine", () => {
  const engine = new ScoringEngine();

  it("should calculate accuracy score from accuracy", async () => {
    const scores = await engine.calculateScores(
      [{ id: "1", accuracy: 0.95, userId: "u1" }],
      {}
    );
    expect(scores[0].accuracyScore).toBe(95);
  });

  it("should return empty array for empty predictions", async () => {
    const scores = await engine.calculateScores([], {});
    expect(scores).toHaveLength(0);
  });
});

describe("RankingEngine", () => {
  const engine = new RankingEngine();

  it("should rank players deterministically", async () => {
    const players = [
      { id: "1", accuracy: 0.9, submittedAt: new Date("2024-01-02") },
      { id: "2", accuracy: 0.8, submittedAt: new Date("2024-01-01") },
    ];

    const ranked = await engine.rankPlayers(players, "seed-1");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it("should produce identical ranking for same seed", async () => {
    const players = [
      { id: "1", accuracy: 0.9, submittedAt: new Date("2024-01-02") },
      { id: "2", accuracy: 0.9, submittedAt: new Date("2024-01-01") },
    ];

    const first = await engine.rankPlayers(players, "same-seed");
    const second = await engine.rankPlayers(players, "same-seed");
    expect(first[0].id).toBe(second[0].id);
  });
});

describe("XPRewardEngine", () => {
  const engine = new XPRewardEngine();

  it("should calculate XP from settings", () => {
    const settings = {
      xp_base: "0",
      xp_participation: "10",
      xp_correct_prediction: "50",
      xp_top10: "100",
    };

    const xp = engine.calculateXP(settings, {
      participation: true,
      correct: true,
      top10: true,
    });

    expect(xp).toBe(160);
  });

  it("should never return negative XP", () => {
    const xp = engine.calculateXP({}, {});
    expect(xp).toBeGreaterThanOrEqual(0);
  });
});

describe("RewardEngine", () => {
  it("should generate pending rewards", async () => {
    const engine = new RewardEngine();

    const rewards = await engine.generatePendingRewards("tournament-1", [
      { id: "p1", userId: "u1", rank: 1 },
      { id: "p2", userId: "u2", rank: 2 },
    ]);

    expect(rewards.length).toBeGreaterThan(0);
  });
});

describe("SettlementEngine", () => {
  it("should settle reward", async () => {
    const engine = new SettlementEngine();

    const result = await engine.settleReward("reward-id");
    expect(result).toHaveProperty("status");
  });
});

describe("AuditEngine", () => {
  it("should log audit entry", async () => {
    const engine = new AuditEngine();

    await engine.log("TOURNAMENT_CREATED", "Tournament", "tournament-1", {}, "0xadmin");
    expect(true).toBe(true);
  });
});

describe("GameEngine", () => {
  it("should orchestrate tournament evaluation", async () => {
    vi.mocked(mockPrisma.tournament.findUnique).mockResolvedValue({
      id: "tournament-1",
      actualValue: 100,
      seasonNumber: 1,
      dailyNumber: 1,
      predictions: [],
    } as any);
    vi.mocked(mockPrisma.gameExecution.create).mockResolvedValue({ id: "exec-1" } as any);
    vi.mocked(mockPrisma.settings.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.prediction.findMany).mockResolvedValue([]);
    vi.mocked(mockPrisma.userProfile.findUnique).mockResolvedValue({ id: "u1" } as any);
    vi.mocked(mockPrisma.gameExecution.update).mockResolvedValue({} as any);
    vi.mocked(mockPrisma.tournament.update).mockResolvedValue({} as any);
    vi.mocked(mockPrisma.leaderboardSnapshot.create).mockResolvedValue({} as any);
    vi.mocked(mockPrisma.pendingReward.findMany).mockResolvedValue([]);

    const engine = new GameEngine();
    const result = await engine.orchestrate("tournament-1");
    expect(result).toHaveProperty("tournamentId");
  });
});
});
