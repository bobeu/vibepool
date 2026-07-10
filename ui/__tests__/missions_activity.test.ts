import { describe, it, expect, vi } from "vitest";
import { ActivityEngine } from "@/services/engines/ActivityEngine";
import { MissionEngine } from "@/services/engines/MissionEngine";
import { StreakEngine } from "@/services/engines/StreakEngine";
import { NotificationEngine } from "@/services/engines/NotificationEngine";
import { StatisticsEngine } from "@/services/engines/StatisticsEngine";
import { ProgressEngine } from "@/services/engines/ProgressEngine";

const mockPrisma = {
  activity: { create: vi.fn(), findMany: vi.fn() },
  userProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
  },
  userMission: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  dailyMission: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  playerStatistic: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (ops: unknown[]) => ops),
};

vi.mock("@/lib/auth/session", () => ({
  prisma: () => mockPrisma,
}));

describe("ActivityEngine", () => {
  it("should record activity and emit event", async () => {
    mockPrisma.activity.create.mockResolvedValue({ id: "activity-1" } as any);
    mockPrisma.userProfile.update.mockResolvedValue({} as any);

    const engine = new ActivityEngine();
    const result = await engine.record("user-1", "LOGIN", { ip: "127.0.0.1" });

    expect(result).toHaveProperty("id", "activity-1");
  });

  it("should get recent activities", async () => {
    mockPrisma.activity.findMany.mockResolvedValue([
      { id: "a1", type: "LOGIN", createdAt: new Date() },
    ] as any);

    const engine = new ActivityEngine();
    const result = await engine.getRecent("user-1", 5);

    expect(result).toHaveLength(1);
  });
});

describe("MissionEngine", () => {
  it("should generate daily missions", async () => {
    mockPrisma.userMission.findMany.mockResolvedValue([]);
    mockPrisma.dailyMission.findMany.mockResolvedValue([
      { id: "m1", title: "Login", category: "DAILY", targetValue: 1, xpReward: 10, pointReward: 5, spinReward: 0 },
    ] as any);
    mockPrisma.userMission.create.mockResolvedValue({
      id: "um1",
      userId: "user-1",
      missionId: "m1",
      currentValue: 0,
      targetValue: 1,
      completed: false,
      claimable: false,
      claimed: false,
      mission: { id: "m1", title: "Login" },
    } as any);

    const engine = new MissionEngine();
    const result = await engine.generateDailyMissions("user-1");

    expect(result.length).toBeGreaterThan(0);
  });

  it("should update mission progress", async () => {
    mockPrisma.userMission.findFirst.mockResolvedValue({
      id: "um1",
      userId: "user-1",
      missionId: "m1",
      currentValue: 0,
      targetValue: 1,
      completed: false,
      claimable: false,
      claimed: false,
    } as any);
    mockPrisma.dailyMission.findFirst.mockResolvedValue({
      id: "m1",
      title: "Login",
    } as any);
    mockPrisma.userMission.update.mockResolvedValue({
      id: "um1",
      currentValue: 1,
      completed: true,
      claimable: true,
    } as any);

    const engine = new MissionEngine();
    const result = await engine.updateProgress("user-1", "m1", 1);

    expect(result).toHaveProperty("completed", true);
  });
});

describe("StreakEngine", () => {
  it("should update streak on first login", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({
      id: "user-1",
      currentStreak: 0,
      longestStreak: 0,
      lastLogin: null,
    } as any);
    mockPrisma.userProfile.update.mockResolvedValue({} as any);

    const engine = new StreakEngine();
    const result = await engine.updateStreak("user-1");

    expect(result.current).toBe(1);
  });

  it("should return streak without updating twice in same day", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({
      id: "user-1",
      currentStreak: 3,
      longestStreak: 5,
      lastLogin: new Date(),
    } as any);

    const engine = new StreakEngine();
    const result = await engine.getStreak("user-1");

    expect(result.current).toBe(3);
  });
});

describe("NotificationEngine", () => {
  it("should send notification", async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      title: "Test",
      body: "Body",
      read: false,
    } as any);

    const engine = new NotificationEngine();
    const result = await engine.send("user-1", "INFO", "Test", "Body");

    expect(result).toHaveProperty("id", "notif-1");
  });

  it("should get unread notifications", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: "notif-1", title: "Test", read: false, priority: "NORMAL" },
    ] as any);

    const engine = new NotificationEngine();
    const result = await engine.getUnread("user-1");

    expect(result).toHaveLength(1);
  });
});

describe("StatisticsEngine", () => {
  it("should increment and get stats", async () => {
    mockPrisma.playerStatistic.upsert.mockResolvedValue({
      userId: "user-1",
      type: "PREDICTIONS_SUBMITTED",
      value: 5,
    } as any);
    mockPrisma.playerStatistic.findMany.mockResolvedValue([
      { type: "PREDICTIONS_SUBMITTED", value: 5 },
    ] as any);
    mockPrisma.userProfile.findUnique.mockResolvedValue({
      id: "user-1",
      xp: 100,
      points: 50,
      spins: 2,
      currentStreak: 3,
      longestStreak: 5,
    } as any);

    const engine = new StatisticsEngine();

    await engine.increment("user-1", "PREDICTIONS_SUBMITTED", 1);
    const stats = await engine.getStats("user-1");

    expect(stats).toHaveProperty("predictionsSubmitted", 5);
    expect(stats).toHaveProperty("xpEarned", 100);
  });
});

describe("ProgressEngine", () => {
  it("should handle prediction activity", async () => {
    mockPrisma.dailyMission.findFirst.mockResolvedValue({
      id: "m1",
      category: "DAILY",
    } as any);
    mockPrisma.userMission.findFirst.mockResolvedValue({
      id: "um1",
      userId: "user-1",
      missionId: "m1",
      currentValue: 0,
      targetValue: 1,
      completed: false,
      claimable: false,
      claimed: false,
    } as any);
    mockPrisma.userMission.update.mockResolvedValue({
      id: "um1",
      currentValue: 1,
      completed: true,
      claimable: true,
    } as any);

    const engine = new ProgressEngine();
    await engine.handleActivity("user-1", "PREDICTION", { tournamentId: "t1" });
  });
});
