import { describe, it, expect, vi } from "vitest";
import { TournamentService } from "@/services/TournamentService";
import { PredictionService } from "@/services/PredictionService";
import { LeaderboardService } from "@/services/LeaderboardService";

const mockPrisma = {
  tournament: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  prediction: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  leaderboardSnapshot: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
  },
  userProfile: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  settings: {
    findMany: vi.fn(),
  },
  gameExecution: {
    create: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  pendingReward: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  rateLimitEntry: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (ops: unknown[]) => ops),
};

vi.mock("@/lib/auth/session", () => ({
  prisma: () => mockPrisma,
}));

describe("TournamentService", () => {
  it("should create a tournament", async () => {
    mockPrisma.tournament.create.mockResolvedValue({
      id: "tournament-1",
      name: "Test Tournament",
      status: "UPCOMING",
      predictions: [],
    } as any);

    const service = new TournamentService();
    const result = await service.createTournament({
      name: "Test Tournament",
      startTime: new Date(),
      endTime: new Date(),
      rewardPool: 1000,
      asset: "0x0000000000000000000000000000000000000000",
      maxPlayers: 100,
      seasonNumber: 1,
      dailyNumber: 1,
    });

    expect(result).toHaveProperty("name", "Test Tournament");
    expect(result).toHaveProperty("status", "UPCOMING");
  });

  it("should return current tournament", async () => {
    mockPrisma.tournament.findFirst.mockResolvedValue({
      id: "tournament-1",
      status: "OPEN",
      predictions: [],
    } as any);

    const service = new TournamentService();
    const result = await service.getCurrentTournament();
    expect(result).toBeDefined();
  });

  it("should implement lifecycle transitions", async () => {
    mockPrisma.tournament.update.mockResolvedValue({
      id: "test-id",
      status: "LOCKED",
      predictions: [],
    } as any);

    const service = new TournamentService();
    await expect(service.startTournament("test-id")).resolves.toBeDefined();
    await expect(service.lockTournament("test-id")).resolves.toBeDefined();
    await expect(service.evaluateTournament("test-id", 100)).resolves.toBeDefined();
    await expect(service.completeTournament("test-id")).resolves.toBeDefined();
    await expect(service.archiveTournament("test-id")).resolves.toBeDefined();
  });
});

describe("PredictionService", () => {
  it("should submit a prediction", async () => {
    mockPrisma.tournament.findFirst.mockResolvedValue({
      id: "tournament-1",
      status: "OPEN",
    } as any);
    mockPrisma.prediction.findFirst.mockResolvedValue(null);
    mockPrisma.prediction.create.mockResolvedValue({
      id: "prediction-1",
      tournamentId: "tournament-1",
      status: "PENDING",
    } as any);

    const service = new PredictionService();
    const result = await service.submitPrediction("0x1234567890123456789012345678901234567890", {
      predictionValue: 100,
    });

    expect(result).toHaveProperty("status", "PENDING");
  });

  it("should evaluate prediction accuracy", async () => {
    mockPrisma.prediction.findUnique.mockResolvedValue({
      id: "prediction-1",
      predictionValue: 100,
    } as any);
    mockPrisma.prediction.update.mockResolvedValue({
      id: "prediction-1",
      accuracy: 0.95,
    } as any);

    const service = new PredictionService();
    const result = await service.evaluatePrediction("prediction-1", 100);
    expect(result).toHaveProperty("accuracy");
    expect(typeof result.accuracy).toBe("number");
  });
});

describe("LeaderboardService", () => {
  it("should return daily leaderboard", async () => {
    mockPrisma.leaderboardSnapshot.findMany.mockResolvedValue([
      { rank: 1, xp: 100, points: 50, user: { wallet: "0x123", username: "user1" } },
    ] as any);

    const service = new LeaderboardService();
    const result = await service.getDaily(10);
    expect(Array.isArray(result)).toBe(true);
  });

  it("should return historical leaderboard", async () => {
    mockPrisma.leaderboardSnapshot.findMany.mockResolvedValue([
      { rank: 1, xp: 100, points: 50, user: { wallet: "0x123", username: "user1" } },
    ] as any);

    const service = new LeaderboardService();
    const result = await service.getHistorical("test-tournament");
    expect(Array.isArray(result)).toBe(true);
  });
});
