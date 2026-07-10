import { describe, it, expect, vi } from "vitest";
import { EventStore } from "@/services/engines/EventStore";
import { MissionRuleEngine } from "@/services/engines/MissionRuleEngine";
import { SpinEngine } from "@/services/engines/SpinEngine";
import { WheelEngine } from "@/services/engines/WheelEngine";
import { RewardClaimEngine } from "@/services/engines/RewardClaimEngine";
import { GamificationEngine } from "@/services/engines/GamificationEngine";
import { SecureRandomProvider } from "@/services/engines/SecureRandomProvider";

const mockPrisma = {
  domainEvent: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  dailyMission: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  userMission: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  spinLedger: {
    create: vi.fn(),
    count: vi.fn(),
  },
  spinReward: {
    findMany: vi.fn(),
  },
  spinHistory: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  rewardQueue: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  rewardClaim: {
    create: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  playerStatistic: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  activity: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  prediction: {
    count: vi.fn(),
  },
  leaderboardSnapshot: {
    findFirst: vi.fn(),
  },
  settings: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (ops: unknown[]) => ops),
};

vi.mock("@/lib/auth/session", () => ({
  prisma: () => mockPrisma,
}));

describe("EventStore", () => {
  it("should append and replay events", async () => {
    mockPrisma.domainEvent.create.mockResolvedValue({ id: "event-1" } as any);
    mockPrisma.domainEvent.findMany.mockResolvedValue([
      { id: "event-1", aggregateId: "user-1", eventType: "Test", payload: {}, version: 1, processed: false, occurredAt: new Date() },
    ] as any);

    const store = new EventStore();
    const id = await store.append({ aggregateId: "user-1", aggregateType: "User", eventType: "Test" });
    expect(id).toBe("event-1");

    const events = await store.replay("user-1");
    expect(events).toHaveLength(1);
  });

  it("should mark events processed", async () => {
    mockPrisma.domainEvent.update.mockResolvedValue({} as any);

    const store = new EventStore();
    await store.markProcessed("event-1");
    expect(mockPrisma.domainEvent.update).toHaveBeenCalled();
  });
});

describe("MissionRuleEngine", () => {
  it("should load rules from mission configs", async () => {
    mockPrisma.dailyMission.findMany.mockResolvedValue([
      { id: "m1", status: "ACTIVE", config: { rule: { activityType: "PREDICTION" } } },
    ] as any);

    const engine = new MissionRuleEngine();
    const rules = await engine.loadRules();

    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty("missionType", "PREDICTION");
  });

  it("should match activity to rules", async () => {
    const engine = new MissionRuleEngine();
    const rules = [
      { condition: { activityType: "PREDICTION" }, action: {} },
      { condition: { activityType: "LOGIN" }, action: {} },
    ];

    expect(engine["matches"](rules[0], "PREDICTION", {})).toBe(true);
    expect(engine["matches"](rules[1], "PREDICTION", {})).toBe(false);
  });
});

describe("SpinEngine", () => {
  it("should grant and consume spins", async () => {
    mockPrisma.userProfile.update.mockResolvedValue({ spins: 1 } as any);
    mockPrisma.spinLedger.create.mockResolvedValue({ id: "spin-1" } as any);

    const engine = new SpinEngine();
    const granted = await engine.grantSpin("user-1", "DAILY", "login");
    expect(granted).toHaveProperty("granted", true);

    mockPrisma.userProfile.findUnique.mockResolvedValue({ spins: 1 } as any);
    const consumed = await engine.consumeSpin("user-1");
    expect(consumed).toBe(true);
  });

  it("should get spin balance", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({ spins: 3 } as any);
    mockPrisma.spinLedger.count.mockResolvedValue(1);

    const engine = new SpinEngine();
    const balance = await engine.getSpinBalance("user-1");

    expect(balance).toHaveProperty("available", 3);
    expect(balance).toHaveProperty("daily", 1);
  });
});

describe("WheelEngine", () => {
  it("should generate spin reward", async () => {
    mockPrisma.spinReward.findMany.mockResolvedValue([
      { id: "r1", name: "XP Pack", asset: "XP", amount: 50, weight: 1, rarity: "Common" },
    ] as any);
    mockPrisma.spinHistory.create.mockResolvedValue({ id: "sh1" } as any);

    const engine = new WheelEngine();
    const result = await engine.generateSpin("user-1", new SecureRandomProvider());

    expect(result).toHaveProperty("reward", "XP Pack");
  });

  it("should return history", async () => {
    mockPrisma.spinHistory.findMany.mockResolvedValue([
      { id: "sh1", reward: "XP Pack", createdAt: new Date() },
    ] as any);

    const engine = new WheelEngine();
    const history = await engine.getSpinHistory("user-1", 10);

    expect(history).toHaveLength(1);
  });
});

describe("RewardClaimEngine", () => {
  it("should claim reward", async () => {
    mockPrisma.rewardQueue.findFirst.mockResolvedValue({
      id: "rq1",
      userId: "user-1",
      reward: "Test",
      asset: "XP",
      amount: 10,
      source: "SPIN",
      status: "PENDING",
    } as any);
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma));

    const engine = new RewardClaimEngine();
    const result = await engine.claimReward("user-1", "rq1");

    expect(result).toHaveProperty("claimed", true);
  });

  it("should get claimable rewards", async () => {
    mockPrisma.rewardQueue.findMany.mockResolvedValue([
      { id: "rq1", userId: "user-1", reward: "Test", status: "PENDING" },
    ] as any);

    const engine = new RewardClaimEngine();
    const rewards = await engine.getClaimableRewards("user-1");

    expect(rewards).toHaveLength(1);
  });
});

describe("GamificationEngine", () => {
  it("should calculate level progress", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({
      id: "user-1",
      level: 2,
      xp: 2500,
      currentRank: 5,
      lastLogin: new Date(),
      totalActivity: 10,
      currentStreak: 3,
      longestStreak: 5,
    } as any);
    mockPrisma.activity.count.mockResolvedValue(10);
    mockPrisma.prediction.count.mockResolvedValue(5);
    mockPrisma.userMission.count.mockResolvedValue(2);
    mockPrisma.spinLedger.count.mockResolvedValue(3);
    mockPrisma.userProfile.count.mockResolvedValue(100);

    const engine = new GamificationEngine();
    const level = await engine.getLevelProgress("user-1");

    expect(level).toHaveProperty("level", 2);
    expect(level).toHaveProperty("progress");
  });

  it("should return engagement metrics", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({
      id: "user-1",
      xp: 100,
      points: 50,
      spins: 2,
      level: 1,
      currentRank: 10,
      lastLogin: new Date(),
      totalActivity: 5,
      currentStreak: 2,
      longestStreak: 5,
    } as any);
    mockPrisma.activity.count.mockResolvedValue(5);
    mockPrisma.prediction.count.mockResolvedValue(3);
    mockPrisma.userMission.count.mockResolvedValue(1);
    mockPrisma.spinLedger.count.mockResolvedValue(2);

    const engine = new GamificationEngine();
    const metrics = await engine.getEngagementMetrics("user-1");

    expect(metrics).toHaveProperty("totalPredictions", 3);
    expect(metrics).toHaveProperty("completedMissions", 1);
  });
});

describe("SecureRandomProvider", () => {
  it("should generate numbers in range", async () => {
    const provider = new SecureRandomProvider();
    const value = await provider.range(1, 10);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(10);
  });

  it("should shuffle arrays", async () => {
    const provider = new SecureRandomProvider();
    const items = [1, 2, 3, 4, 5];
    const shuffled = await provider.shuffle(items);

    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort()).toEqual(items);
  });
});
