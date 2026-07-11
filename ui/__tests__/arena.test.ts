import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArenaEngine } from "@/services/engines/ArenaEngine";
import { MatchmakingEngine } from "@/services/engines/MatchmakingEngine";
import { MatchEngine } from "@/services/engines/MatchEngine";
import { ResultEngine } from "@/services/engines/ResultEngine";
import { SpectatorEngine } from "@/services/engines/SpectatorEngine";
import { ReferralFraudEngine } from "@/services/engines/ReferralFraudEngine";
import { SimpleRatingStrategy } from "@/services/engines/rating/SimpleRatingStrategy";
import { feedPriorityWeight, compareFeedItems } from "@/lib/feed/priority";
import { getAnimationDefinition, listAnimationDefinitions } from "@/lib/animations/registry";
import { leagueForRating } from "@/lib/arena/constants";

const USER_A = "user-a";
const USER_B = "user-b";
const WALLET_A = "0xA";
const WALLET_B = "0xB";

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
    userProfile: [
      { id: USER_A, wallet: WALLET_A, username: "alice", xp: 0, points: 0 },
      { id: USER_B, wallet: WALLET_B, username: "bob", xp: 0, points: 0 },
    ],
    arenaRating: [],
    arenaQueue: [],
    arenaMatch: [],
    matchParticipant: [],
    arenaResult: [],
    arenaReplay: [],
    arenaSeasonStatistic: [],
    arenaPresence: [],
    friendship: [{ id: "f1", userId: USER_A, friendId: USER_B }],
    referral: [],
    referralFraudSignal: [],
    activity: [],
    playerStatistic: [],
    season: [{ id: "s1", number: 1, name: "Season 1", status: "ACTIVE", startAt: new Date(), endAt: new Date(Date.now() + 86400000) }],
    seasonTier: [],
    seasonProgress: [],
    arenaAnalyticsMetric: [],
  };

  const makeModel = (name: string) => ({
    findFirst: vi.fn(async ({ where, orderBy }: any) => {
      let rows = [...(store[name] ?? [])];
      if (where) {
        rows = rows.filter((r) => {
          return Object.entries(where).every(([key, value]) => {
            if (key === "OR") return (value as any[]).some((clause) => Object.entries(clause).every(([k, v]) => r[k] === v));
            if (value && typeof value === "object") {
              if ("gte" in (value as any) && "lte" in (value as any)) {
                return r[key] >= (value as any).gte && r[key] <= (value as any).lte;
              }
              if ("not" in (value as any)) return r[key] !== (value as any).not;
              if ("in" in (value as any)) return (value as any).in.includes(r[key]);
              if ("gte" in (value as any)) return r[key] >= (value as any).gte;
              if ("lte" in (value as any)) return r[key] <= (value as any).lte;
              if ("gt" in (value as any)) {
                const cmp = (value as any).gt;
                return r[key] instanceof Date && cmp instanceof Date
                  ? r[key].getTime() > cmp.getTime()
                  : r[key] > cmp;
              }
            }
            return r[key] === value;
          });
        });
      }
      if (orderBy?.createdAt === "asc") return rows.sort((a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0))[0] ?? null;
      if (orderBy?.createdAt === "desc") return rows[rows.length - 1] ?? null;
      if (orderBy?.number === "desc") return rows.sort((a, b) => (b.number ?? 0) - (a.number ?? 0))[0] ?? null;
      return rows[0] ?? null;
    }),
    findMany: vi.fn(async ({ where, include }: any) => {
      let rows = [...(store[name] ?? [])];
      if (where?.status?.in) rows = rows.filter((r) => where.status.in.includes(r.status));
      if (include?.participants) {
        rows = rows.map((r) => ({
          ...r,
          participants: (store.matchParticipant ?? []).filter((p: any) => p.matchId === r.id).map((p: any) =>
            include.participants.include?.user
              ? { ...p, user: (store.userProfile ?? []).find((u: any) => u.id === p.userId) }
              : p
          ),
        }));
      }
      return rows;
    }),
    findUnique: vi.fn(async ({ where, include }: any) => {
      const rows = store[name] ?? [];
      let row: any = null;
      if (where.userId_seasonNumber) {
        row = rows.find((r) => r.userId === where.userId_seasonNumber.userId && r.seasonNumber === where.userId_seasonNumber.seasonNumber) ?? null;
      } else if (where.matchId_userId) {
        row = rows.find((r) => r.matchId === where.matchId_userId.matchId && r.userId === where.matchId_userId.userId) ?? null;
      } else if (where.wallet) row = rows.find((r) => r.wallet === where.wallet) ?? null;
      else if (where.id) row = rows.find((r) => r.id === where.id) ?? null;
      else if (where.userId) row = rows.find((r) => r.userId === where.userId) ?? null;
      else if (where.inviteCode) row = rows.find((r) => r.inviteCode === where.inviteCode) ?? null;
      else if (where.matchId) row = rows.find((r) => r.matchId === where.matchId) ?? null;

      if (row && include?.participants) {
        row = {
          ...row,
          participants: (store.matchParticipant ?? []).filter((p: any) => p.matchId === row.id),
        };
      }
      if (row && include?.result) {
        row = { ...row, result: (store.arenaResult ?? []).find((r: any) => r.matchId === row.id) ?? null };
      }
      if (row && include?.replay) {
        row = { ...row, replay: (store.arenaReplay ?? []).find((r: any) => r.matchId === row.id) ?? null };
      }
      return row;
    }),
    create: vi.fn(async ({ data }: any) => {
      const { participants, ...rest } = data ?? {};
      const row = { id: `${name}-${store[name].length + 1}`, createdAt: new Date(), ...rest };
      store[name].push(row);
      if (participants?.create) {
        const items = Array.isArray(participants.create) ? participants.create : [participants.create];
        store.matchParticipant ??= [];
        for (const p of items) {
          store.matchParticipant.push({
            id: `matchParticipant-${store.matchParticipant.length + 1}`,
            matchId: row.id,
            accepted: false,
            ...p,
          });
        }
      }
      return row;
    }),
    createMany: vi.fn(async ({ data }: any) => {
      for (const item of data) store[name].push({ id: `${name}-${store[name].length + 1}`, ...item });
      return { count: data.length };
    }),
    update: vi.fn(async ({ where, data }: any) => {
      const rows = store[name];
      const idx = rows.findIndex((r) => r.id === where.id);
      if (idx >= 0) rows[idx] = { ...rows[idx], ...data };
      return rows[idx];
    }),
    updateMany: vi.fn(async ({ where, data }: any) => {
      let count = 0;
      for (const row of store[name] ?? []) {
        if (!where.id?.in || where.id.in.includes(row.id)) {
          Object.assign(row, data);
          count++;
        }
        if (where.userId && row.userId === where.userId) {
          Object.assign(row, data);
          count++;
        }
        if (where.matchId && row.matchId === where.matchId) {
          Object.assign(row, data);
          count++;
        }
      }
      return { count };
    }),
    upsert: vi.fn(async ({ where, create, update }: any) => {
      const existing = await makeModel(name).findUnique({ where });
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const row = { id: `${name}-${store[name].length + 1}`, ...create };
      store[name].push(row);
      return row;
    }),
    count: vi.fn(async () => (store[name] ?? []).length),
  });

  for (const model of Object.keys(store)) {
    mockPrisma[model] = makeModel(model);
  }

  mockPrisma._store = store;
}

describe("NEXORA Arena", () => {
  beforeEach(() => {
    resetMock();
    vi.clearAllMocks();
  });

  describe("Rating framework", () => {
    it("updates rating on win", () => {
      const strategy = new SimpleRatingStrategy();
      const result = strategy.updateRating({
        player: { skillRating: 1000, ratingDeviation: 350, matchesPlayed: 0, winRate: 0, currentStreak: 0, bestStreak: 0 },
        opponent: { skillRating: 1000, ratingDeviation: 350, matchesPlayed: 0, winRate: 0, currentStreak: 0, bestStreak: 0 },
        outcome: "WIN",
      });
      expect(result.skillRating).toBeGreaterThan(1000);
      expect(result.currentStreak).toBe(1);
    });

    it("maps leagues from rating", () => {
      expect(leagueForRating(1850)).toBe("LEGEND");
      expect(leagueForRating(1050)).toBe("BRONZE");
    });
  });

  describe("MatchmakingEngine", () => {
    it("joins quick match queue", async () => {
      const engine = new MatchmakingEngine();
      const result = await engine.joinQueue(WALLET_A, "QUICK_MATCH");
      expect(result.status).toBe("SEARCHING");
      expect(mockPrisma._store.arenaQueue.length).toBe(1);
    });

    it("creates private match with invite code", async () => {
      const engine = new MatchmakingEngine();
      const result = await engine.joinQueue(WALLET_A, "PRIVATE_MATCH");
      expect(result.matchId).toBeDefined();
      expect(result.inviteCode).toBeDefined();
      expect(result.status).toBe("WAITING");
    });

    it("cancels queue", async () => {
      const engine = new MatchmakingEngine();
      await engine.joinQueue(WALLET_A, "QUICK_MATCH");
      const result = await engine.cancelQueue(WALLET_A);
      expect(result.cancelled).toBe(true);
    });
  });

  describe("MatchEngine + ResultEngine", () => {
    it("accepts match and submits predictions", async () => {
      mockPrisma._store.arenaMatch.push({
        id: "m1",
        status: "PLAYING",
        targetValue: 5000,
        matchType: "PREDICTION_DUEL",
        mode: "QUICK_MATCH",
      });
      mockPrisma._store.matchParticipant.push(
        { id: "p1", matchId: "m1", userId: USER_A, accepted: true, prediction: 4990 },
        { id: "p2", matchId: "m1", userId: USER_B, accepted: true, prediction: 5100 }
      );

      const resultEngine = new ResultEngine();
      const result = await resultEngine.finalizeMatch("m1");
      expect(result.status).toBe("COMPLETED");
      expect(result.isDraw).toBe(false);
      expect(mockPrisma._store.arenaResult.length).toBe(1);
      expect(mockPrisma._store.arenaReplay.length).toBe(1);
    });
  });

  describe("ArenaEngine", () => {
    it("returns home data", async () => {
      mockPrisma._store.arenaRating.push({
        id: "r1",
        userId: USER_A,
        seasonNumber: 1,
        skillRating: 1200,
        league: "GOLD",
        winRate: 0.5,
        matchesPlayed: 4,
        currentStreak: 2,
        bestStreak: 3,
        ratingDeviation: 300,
      });

      const engine = new ArenaEngine();
      const home = await engine.getHome(WALLET_A);
      expect(home.name).toBe("NEXORA Arena");
      expect((home.rating as any).skillRating).toBe(1200);
    });
  });

  describe("SpectatorEngine", () => {
    it("lists live matches", async () => {
      mockPrisma._store.arenaMatch.push({ id: "m1", status: "PLAYING", matchType: "PREDICTION_DUEL" });
      const engine = new SpectatorEngine();
      const live = await engine.getLiveMatches();
      expect(live.length).toBe(1);
    });
  });

  describe("Referral fraud", () => {
    it("flags suspicious referrals", async () => {
      mockPrisma._store.referral.push({
        id: "ref1",
        referrerId: USER_A,
        referredId: USER_B,
        code: "ABC",
        fraudStatus: "CLEAR",
        deviceHash: "device1",
        ipHash: "ip1",
        createdAt: new Date(),
      });

      const engine = new ReferralFraudEngine();
      const result = await engine.evaluateReferral("ref1", { deviceHash: "device1", ipHash: "ip1" });
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe("Prompt 10 fixes", () => {
    it("ranks feed items by priority", () => {
      expect(feedPriorityWeight("PINNED", "ARENA_VICTORY", true)).toBeGreaterThan(feedPriorityWeight("LOW", "PRESENCE"));
      const sorted = [
        { pinned: false, rankScore: 50, createdAt: new Date("2024-01-02") },
        { pinned: true, rankScore: 100, createdAt: new Date("2024-01-01") },
      ].sort(compareFeedItems);
      expect(sorted[0].pinned).toBe(true);
    });

    it("registers arena animations centrally", () => {
      const def = getAnimationDefinition("ARENA_VICTORY");
      expect(def.priority).toBe("URGENT");
      expect(listAnimationDefinitions().some((d) => d.type === "ARENA_VICTORY")).toBe(true);
    });
  });
});
