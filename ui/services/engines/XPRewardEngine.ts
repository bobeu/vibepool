import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IXPRewardEngine } from "./interfaces";

function getSettings(): Promise<Record<string, string>> {
  const all = await prisma().settings.findMany();
  return Object.fromEntries(all.map((s) => [s.key, s.value]));
}

function getSetting(settings: Record<string, string>, key: string, fallback: string): string {
  return settings[key] ?? fallback;
}

export class XPRewardEngine implements IXPRewardEngine {
  name = "XPRewardEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  calculateXP(settings: Record<string, string>, data: Record<string, unknown>): number {
    let xp = Number(getSetting(settings, "xp_base", "0"));

    const participation = Number(getSetting(settings, "xp_participation", "10"));
    const correct = Number(getSetting(settings, "xp_correct_prediction", "50"));
    const top10 = Number(getSetting(settings, "xp_top10", "100"));
    const top3 = Number(getSetting(settings, "xp_top3", "200"));
    const winner = Number(getSetting(settings, "xp_winner", "500"));
    const streak = Number(getSetting(settings, "xp_streak_bonus", "25"));
    const daily = Number(getSetting(settings, "xp_daily_bonus", "10"));

    xp += (data.participation as boolean) ? participation : 0;
    xp += (data.correct as boolean) ? correct : 0;
    xp += (data.top10 as boolean) ? top10 : 0;
    xp += (data.top3 as boolean) ? top3 : 0;
    xp += (data.winner as boolean) ? winner : 0;
    xp += (data.streak as boolean) ? streak : 0;
    xp += (data.daily as boolean) ? daily : 0;

    return Math.max(0, xp);
  }

  calculateBonusXP(settings: Record<string, string>, baseXP: number): number {
    const multiplier = Number(getSetting(settings, "xp_bonus_multiplier", "1.5"));
    return Math.floor(baseXP * (multiplier - 1));
  }

  calculatePenalty(settings: Record<string, string>, baseXP: number): number {
    const penaltyRate = Number(getSetting(settings, "xp_penalty_rate", "0.1"));
    return Math.floor(baseXP * penaltyRate);
  }
}
