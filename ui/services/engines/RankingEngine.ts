import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IRankingEngine } from "./interfaces";

function deterministicSort(a: Record<string, unknown>, b: Record<string, unknown>, seed: string): number {
  const accuracyA = (a.accuracy as number) ?? 0;
  const accuracyB = (b.accuracy as number) ?? 0;
  if (accuracyA !== accuracyB) return accuracyB - accuracyA;

  const totalScoreA = (a.totalScore as number) ?? 0;
  const totalScoreB = (b.totalScore as number) ?? 0;
  if (totalScoreA !== totalScoreB) return totalScoreB - totalScoreA;

  const timeA = new Date(a.submittedAt as string).getTime() || 0;
  const timeB = new Date(b.submittedAt as string).getTime() || 0;
  if (timeA !== timeB) return timeA - timeB;

  if (seed > `${a.id}`) return -1;
  if (seed < `${a.id}`) return 1;
  return 0;
}

export class RankingEngine implements IRankingEngine {
  name = "RankingEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async rankPlayers(
    scores: Record<string, unknown>[],
    seed: string
  ): Promise<Record<string, unknown>[]> {
    const sorted = [...scores].sort((a, b) => deterministicSort(a, b, seed));
    return sorted.map((player, index) => ({
      ...player,
      rank: index + 1,
    }));
  }
}
