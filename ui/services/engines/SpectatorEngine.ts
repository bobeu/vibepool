import { prisma } from "@/lib/auth/session";
import type { ISpectatorEngine } from "./interfaces";

/** Read-only spectator access. Architecture supports future live streaming hooks. */
export class SpectatorEngine implements ISpectatorEngine {
  name = "SpectatorEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async getLiveMatches(limit = 20): Promise<Record<string, unknown>[]> {
    const matches = await prisma().arenaMatch.findMany({
      where: { status: { in: ["PLAYING", "COUNTDOWN"] } },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        participants: { include: { user: { select: { username: true, wallet: true } } } },
      },
    });

    return matches.map((m) => ({
      id: m.id,
      status: m.status,
      matchType: m.matchType,
      participants: m.participants.map((p) => ({
        username: p.user.username ?? p.user.wallet,
        accepted: p.accepted,
        hasPrediction: p.prediction != null,
      })),
    }));
  }

  async watchMatch(matchId: string): Promise<Record<string, unknown>> {
    const match = await prisma().arenaMatch.findUnique({
      where: { id: matchId },
      include: {
        participants: { include: { user: { select: { username: true, wallet: true } } } },
        replay: true,
      },
    });
    if (!match) throw new Error("Match not found");

    const isLive = ["PLAYING", "COUNTDOWN", "FINISHED"].includes(match.status);

    return {
      id: match.id,
      status: match.status,
      matchType: match.matchType,
      live: isLive,
      targetValue: match.status === "COMPLETED" ? match.targetValue : null,
      participants: match.participants.map((p) => ({
        username: p.user.username ?? p.user.wallet,
        prediction: match.status === "COMPLETED" ? p.prediction : null,
        score: match.status === "COMPLETED" ? p.score : null,
        outcome: p.outcome,
      })),
      timeline: match.replay?.timeline ?? [],
    };
  }

  async setSpectating(wallet: string, matchId: string | null): Promise<Record<string, unknown>> {
    const user = await prisma().userProfile.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) throw new Error("User not found");

    await prisma().arenaPresence.upsert({
      where: { userId: user.id },
      update: {
        status: matchId ? "SPECTATING" : "OFFLINE",
        matchId,
      },
      create: {
        userId: user.id,
        status: matchId ? "SPECTATING" : "OFFLINE",
        matchId,
      },
    });

    return { status: matchId ? "SPECTATING" : "OFFLINE", matchId };
  }
}
