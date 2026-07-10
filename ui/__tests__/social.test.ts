import { describe, it, expect, vi, beforeEach } from "vitest";
import { FriendEngine } from "@/services/engines/FriendEngine";
import { ReferralEngine } from "@/services/engines/ReferralEngine";
import { InviteEngine } from "@/services/engines/InviteEngine";
import { FeedEngine } from "@/services/engines/FeedEngine";
import { PresenceEngine } from "@/services/engines/PresenceEngine";
import { CommunityEngine } from "@/services/engines/CommunityEngine";
import { AchievementEngine } from "@/services/engines/AchievementEngine";
import { SocialSettingsEngine } from "@/services/engines/SocialSettingsEngine";
import { UnlockAnimationEngine } from "@/services/engines/UnlockAnimationEngine";
import { orderAnimations, shouldInterrupt, priorityWeight } from "@/lib/animations/priority";

const USER_A = "user-a-id";
const USER_B = "user-b-id";

function makeMockPrisma() {
  const data: Record<string, any[]> = {
    userProfile: [
      { id: USER_A, wallet: "0xA", username: "alice", xp: 100, level: 2 },
      { id: USER_B, wallet: "0xB", username: "bob", xp: 50, level: 1 },
    ],
  };

  const resolveInclude = (row: any, include: any) => {
    if (!include) return row;
    const enriched = { ...row };
    if (include.friend) {
      const friend = (data.userProfile ?? []).find((u) => u.id === row.friendId);
      enriched.friend = friend ?? null;
    }
    if (include.actor) {
      const actor = (data.userProfile ?? []).find((u) => u.id === row.actorId);
      enriched.actor = actor ?? null;
    }
    if (include.author) {
      const author = (data.userProfile ?? []).find((u) => u.id === row.authorId);
      enriched.author = author ?? null;
    }
    return enriched;
  };

  const matchesWhere = (row: any, where: any): boolean => {
    if (!where) return true;
    return Object.entries(where).every(([key, value]) => {
      if (key === "OR") {
        return (value as any[]).some((clause) => matchesWhere(row, clause));
      }
      if (value && typeof value === "object") {
        if ("some" in (value as any)) {
          const nested = (value as any).some;
          const collection = key === "rewards" ? data.referralReward ?? [] : [];
          return collection.some((child: any) => {
            const related = child.referralId === row.id || child.userId === row.id;
            return related && matchesWhere(child, nested);
          });
        }
        if ("in" in (value as any)) return (value as any).in.includes(row[key]);
        if ("equals" in (value as any)) return row[key] === (value as any).equals;
      }
      return row[key] === value;
    });
  };

  const makeCollection = (name: string) => ({
    findUnique: vi.fn(async (args: any) => {
      const rows = data[name] ?? (data[name] = []);
      const where = args?.where ?? {};
      if (where.userId_type) {
        return rows.find((r) => r.userId === where.userId_type.userId && r.type === where.userId_type.type) ?? null;
      }
      if (where.referralId_milestone) {
        return rows.find(
          (r) => r.referralId === where.referralId_milestone.referralId && r.milestone === where.referralId_milestone.milestone
        ) ?? null;
      }
      if (where.userId_relatedId_type) {
        const w = where.userId_relatedId_type;
        return rows.find((r) => r.userId === w.userId && r.relatedId === w.relatedId && r.type === w.type) ?? null;
      }
      if (where.senderId_receiverId) {
        const w = where.senderId_receiverId;
        return rows.find((r) => r.senderId === w.senderId && r.receiverId === w.receiverId) ?? null;
      }
      if (where.referredId) {
        return rows.find((r) => r.referredId === where.referredId) ?? null;
      }
      if (where.id) {
        const row = rows.find((r) => r.id === where.id) ?? null;
        return row ? resolveInclude(row, args.include) : null;
      }
      if (where.wallet) {
        const row = rows.find((r) => r.wallet === where.wallet) ?? null;
        return row ? resolveInclude(row, args.include) : null;
      }
      if (where.userId) {
        const row = rows.find((r) => r.userId === where.userId) ?? null;
        return row ? resolveInclude(row, args.include) : null;
      }
      if (where.code) {
        const row = rows.find((r) => r.code === where.code) ?? null;
        return row ? resolveInclude(row, args.include) : null;
      }
      return null;
    }),
    findFirst: vi.fn(async (args: any) => {
      const rows = data[name] ?? (data[name] = []);
      return rows.find((r) => matchesWhere(r, args?.where ?? {})) ?? null;
    }),
    findMany: vi.fn(async (args: any) => {
      const rows = data[name] ?? (data[name] = []);
      const filtered = args?.where ? rows.filter((r) => matchesWhere(r, args.where)) : rows;
      return filtered.map((row) => resolveInclude(row, args?.include));
    }),
    create: vi.fn(async (args: any) => {
      const row = { id: `gen-${name}-${Math.random()}`, createdAt: new Date(), ...args.data };
      (data[name] ?? (data[name] = [])).push(row);
      return row;
    }),
    createMany: vi.fn(async (args: any) => {
      for (const d of args.data ?? []) (data[name] ?? (data[name] = [])).push({ id: `gen-${Math.random()}`, ...d });
      return { count: (args.data ?? []).length };
    }),
    update: vi.fn(async (args: any) => {
      const rows = data[name] ?? (data[name] = []);
      const idx = rows.findIndex((r) => r.id === args.where.id);
      rows[idx] = { ...rows[idx], ...args.data };
      return rows[idx];
    }),
    updateMany: vi.fn(async () => ({ count: 1 })),
    deleteMany: vi.fn(async (args: any) => {
      const rows = data[name] ?? (data[name] = []);
      const keep = rows.filter((r) => !matchesWhere(r, args?.where ?? {}));
      data[name] = keep;
      return { count: rows.length - keep.length };
    }),
    upsert: vi.fn(async (args: any) => {
      const rows = data[name] ?? (data[name] = []);
      const where = args.where ?? {};
      const idx = rows.findIndex((r) => {
        if (where.id) return r.id === where.id;
        if (where.userId) return r.userId === where.userId;
        if (where.senderId_receiverId) {
          return r.senderId === where.senderId_receiverId.senderId && r.receiverId === where.senderId_receiverId.receiverId;
        }
        if (where.referralId_milestone) {
          return r.referralId === where.referralId_milestone.referralId && r.milestone === where.referralId_milestone.milestone;
        }
        if (where.userId_relatedId_type) {
          const w = where.userId_relatedId_type;
          return r.userId === w.userId && r.relatedId === w.relatedId && r.type === w.type;
        }
        return where.wallet && r.wallet === where.wallet;
      });
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...args.update };
        return rows[idx];
      }
      const row = { id: `gen-${Math.random()}`, ...args.create };
      rows.push(row);
      return row;
    }),
    count: vi.fn(async (args: any) => {
      const rows = data[name] ?? [];
      return args?.where ? rows.filter((r) => matchesWhere(r, args.where)).length : rows.length;
    }),
  });

  return new Proxy(
    { __data: data, reset() {
      for (const key of Object.keys(data)) {
        if (key === "userProfile") {
          data[key] = [
            { id: USER_A, wallet: "0xA", username: "alice", xp: 100, level: 2 },
            { id: USER_B, wallet: "0xB", username: "bob", xp: 50, level: 1 },
          ];
        } else {
          data[key] = [];
        }
      }
    } },
    {
      get(target: any, prop: string) {
        if (prop === "__data") return target.__data;
        if (prop === "reset") return target.reset;
        if (!target[prop]) target[prop] = makeCollection(prop);
        return target[prop];
      },
    }
  );
}

const mockPrisma = makeMockPrisma();

vi.mock("@/lib/auth/session", () => ({
  prisma: () => mockPrisma,
}));

vi.mock("@/services/engines/EventBus", () => ({
  eventBus: { publish: vi.fn(), subscribe: vi.fn(() => () => {}) },
}));

vi.mock("@/lib/logging", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  mockPrisma.reset();
  vi.clearAllMocks();
});

describe("FriendEngine", () => {
  const engine = new FriendEngine();

  it("resolves wallet to id and returns friends", async () => {
    mockPrisma.__data.friendship = [{ id: "f1", userId: USER_A, friendId: USER_B }];
    const friends = await engine.getFriends("0xA");
    expect(friends).toHaveLength(1);
    expect(friends[0].wallet).toBe("0xB");
  });

  it("rejects self-friend requests", async () => {
    await expect(engine.sendRequest("0xA", "0xA")).rejects.toThrow("yourself");
  });

  it("creates a friend request and publishes an event", async () => {
    const { eventBus } = await import("@/services/engines/EventBus");
    const result = await engine.sendRequest("0xA", "0xB", "hi");
    expect(result.status).toBe("PENDING");
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ event: "FriendRequestSent" }));
  });

  it("accepts a request and creates a mutual friendship", async () => {
    mockPrisma.__data.friendRequest = [{ id: "req1", senderId: USER_A, receiverId: USER_B, status: "PENDING" }];
    const res = await engine.respond("0xB", "req1", true);
    expect(res.status).toBe("ACCEPTED");
    const friendships = mockPrisma.__data.friendship ?? [];
    expect(friendships.length).toBeGreaterThanOrEqual(2);
  });

  it("blocks a user and removes any friendship", async () => {
    mockPrisma.__data.friendship = [
      { id: "f1", userId: USER_A, friendId: USER_B },
      { id: "f2", userId: USER_B, friendId: USER_A },
    ];
    const res = await engine.block("0xA", "0xB");
    expect(res.blocked).toBe(true);
    const rels = mockPrisma.__data.playerRelationship ?? [];
    expect(rels.some((r: any) => r.type === "BLOCKED")).toBe(true);
  });
});

describe("ReferralEngine", () => {
  const engine = new ReferralEngine();

  beforeEach(() => {
    mockPrisma.__data.referral = [{ id: "ref1", referrerId: USER_A, referredId: USER_B, status: "PENDING" }];
    mockPrisma.__data.referralReward = [];
  });

  it("records a milestone and creates a reward", async () => {
    const { eventBus } = await import("@/services/engines/EventBus");
    const res = await engine.recordMilestone("0xB", "FIRST_PREDICTION");
    expect(res).toHaveLength(1);
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ event: "ReferralCompleted" }));
    expect(mockPrisma.__data.referralReward.length).toBe(1);
  });

  it("does not record a milestone for unknown referral", async () => {
    const res = await engine.recordMilestone("0xNOPE", "FIRST_PREDICTION");
    expect(res).toHaveLength(0);
  });

  it("claims a reward and queues settlement", async () => {
    mockPrisma.__data.referralReward = [
      { id: "rw1", referralId: "ref1", milestone: "FIRST_PREDICTION", rewardType: "POINTS", amount: 250, claimed: false },
    ];
    const res = await engine.claimReward("0xA", "rw1");
    expect(res.claimed).toBe(true);
    expect(mockPrisma.__data.rewardQueue.length).toBeGreaterThanOrEqual(1);
  });
});

describe("InviteEngine", () => {
  const engine = new InviteEngine();

  it("generates a code, url and deep link", async () => {
    const res = await engine.generate("0xA", "INVITE_CODE");
    expect(res.code).toMatch(/^[A-Z0-9]{8}$/);
    expect(res.url).toContain(res.code);
    expect(res.deepLink).toContain(res.code);
  });

  it("redeems an invite and creates a referral", async () => {
    mockPrisma.__data.inviteCode = [{ id: "inv1", ownerId: USER_A, code: "ABC12345", uses: 0 }];
    const res = await engine.redeem("ABC12345", "0xB");
    expect(res.referralId).toBeDefined();
    expect(mockPrisma.__data.referral.length).toBe(1);
  });
});

describe("FeedEngine", () => {
  const engine = new FeedEngine();

  it("publishes a feed item and emits FeedItemCreated", async () => {
    const { eventBus } = await import("@/services/engines/EventBus");
    const res = await engine.publish({ userId: USER_A, type: "ACHIEVEMENT", title: "Win", body: "boom" });
    expect(res.id).toBeDefined();
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ event: "FeedItemCreated" }));
  });
});

describe("PresenceEngine", () => {
  const engine = new PresenceEngine();

  it("sets presence and expires for online status", async () => {
    const { eventBus } = await import("@/services/engines/EventBus");
    const res = await engine.setPresence("0xA", "PLAYING_TOURNAMENT");
    expect(res.status).toBe("PLAYING_TOURNAMENT");
    expect(res.expiresAt).toBeTruthy();
    expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({ event: "PresenceChanged" }));
  });

  it("treats offline status as no expiry", async () => {
    const res = await engine.setPresence("0xA", "OFFLINE");
    expect(res.expiresAt).toBeNull();
  });
});

describe("CommunityEngine", () => {
  const engine = new CommunityEngine();

  it("creates an announcement post", async () => {
    const res = await engine.createPost("0xA", { type: "ANNOUNCEMENT", title: "Hello", body: "World" });
    expect(res.id).toBeDefined();
    expect(mockPrisma.__data.communityPost.length).toBeGreaterThanOrEqual(1);
  });
});

describe("SocialSettingsEngine", () => {
  const engine = new SocialSettingsEngine();

  it("returns default settings for a user", async () => {
    const settings = await engine.getSettings("0xA");
    expect(settings.onlineStatus).toBe(true);
    expect(settings.friendRequests).toBe(true);
  });
});

describe("UnlockAnimationEngine", () => {
  const engine = new UnlockAnimationEngine();

  it("queues animations with priority metadata", async () => {
    const res = await engine.enqueue(USER_A, "ACHIEVEMENT", "ach-1", { title: "Legend" }, "LEGENDARY");
    expect(res.priority).toBe("URGENT");
    expect(mockPrisma.__data.unlockAnimation.length).toBe(1);
  });
});

describe("Animation priority", () => {
  it("weights priorities correctly", () => {
    expect(priorityWeight("URGENT")).toBeGreaterThan(priorityWeight("NORMAL"));
    expect(priorityWeight("LOW")).toBe(0);
  });

  it("orders animations by priority then time", () => {
    const items = [
      { id: "a", priority: "NORMAL", createdAt: "2026-01-02" },
      { id: "b", priority: "URGENT", createdAt: "2026-01-01" },
      { id: "c", priority: "LOW", createdAt: "2026-01-03" },
    ];
    const ordered = orderAnimations(items);
    expect(ordered[0].id).toBe("b");
    expect(ordered[ordered.length - 1].id).toBe("c");
  });

  it("interrupts lower priority animations", () => {
    expect(shouldInterrupt({ priority: "URGENT", interrupt: true }, { priority: "NORMAL" })).toBe(true);
    expect(shouldInterrupt({ priority: "NORMAL", interrupt: false }, { priority: "URGENT" })).toBe(false);
  });
});

describe("AchievementEngine compound rules", () => {
  const engine = new AchievementEngine();

  it("evaluates an OR group as passed when any subset completes", async () => {
    mockPrisma.__data.playerStatistic = [
      { userId: USER_A, type: "PREDICTIONS_SUBMITTED", value: 100 },
    ];
    const progress = await (engine as any).evaluateRule(USER_A, {
      id: "a1",
      rules: [],
      ruleGroups: [
        {
          logic: "OR",
          rules: [
            { statType: "PREDICTIONS_SUBMITTED", operator: "GTE", targetValue: 100, windowDays: 0 },
            { statType: "TOURNAMENT_WINS", operator: "GTE", targetValue: 1, windowDays: 0 },
          ],
        },
      ],
    });
    expect(progress.current).toBeGreaterThanOrEqual(progress.target);
  });

  it("evaluates an AND group as failed when one subset is incomplete", async () => {
    mockPrisma.__data.playerStatistic = [
      { userId: USER_A, type: "PREDICTIONS_SUBMITTED", value: 100 },
    ];
    const progress = await (engine as any).evaluateRule(USER_A, {
      id: "a2",
      rules: [],
      ruleGroups: [
        {
          logic: "AND",
          rules: [
            { statType: "PREDICTIONS_SUBMITTED", operator: "GTE", targetValue: 100, windowDays: 0 },
            { statType: "TOURNAMENT_WINS", operator: "GTE", targetValue: 1, windowDays: 0 },
          ],
        },
      ],
    });
    expect(progress.current).toBeLessThan(progress.target);
  });
});
