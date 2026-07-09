import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IRewardEngine } from "./interfaces";

function getSettings(): Promise<Record<string, string>> {
  const all = await prisma().settings.findMany();
  return Object.fromEntries(all.map((s) => [s.key, s.value]));
}

function getSetting(settings: Record<string, string>, key: string, fallback: string): string {
  return settings[key] ?? fallback;
}

export class RewardEngine implements IRewardEngine {
  name = "RewardEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async generatePendingRewards(
    tournamentId: string,
    rankedPlayers: Record<string, unknown>[]
  ): Promise<Record<string, unknown>[]> {
    const settings = await getSettings();
    const asset = getSetting(settings, "reward_asset", "USDC");
    const totalPool = Number(getSetting(settings, "reward_pool", "1000"));
    const participants = rankedPlayers.length;

    const rewards: Record<string, unknown>[] = [];
    let distributed = 0;

    for (let i = 0; i < rankedPlayers.length; i++) {
      const player = rankedPlayers[i];
      const rank = i + 1;

      let rewardAmount = 0;
      let rewardType = "participation";

      if (rank === 1) {
        rewardAmount = Math.floor(totalPool * 0.5);
        rewardType = "winner";
      } else if (rank <= 3) {
        rewardAmount = Math.floor(totalPool * 0.25 / 2);
        rewardType = "top3";
      } else if (rank <= 10) {
        rewardAmount = Math.floor(totalPool * 0.2 / 7);
        rewardType = "top10";
      } else {
        rewardAmount = Math.floor((totalPool * 0.05) / Math.max(participants - 10, 1));
        rewardType = "participation";
      }

      distributed += rewardAmount;

      const pendingReward = await prisma().pendingReward.create({
        data: {
          userId: player.userId as string,
          tournamentId,
          predictionId: player.id as string,
          reward: `Tournament Rank ${rank}`,
          asset,
          amount: rewardAmount,
          reason: rewardType,
          status: "PENDING",
        },
      });

      rewards.push({
        id: pendingReward.id,
        userId: player.userId,
        tournamentId,
        predictionId: player.id,
        reward: pendingReward.reward,
        asset: pendingReward.asset,
        amount: pendingReward.amount,
        reason: pendingReward.reason,
        status: pendingReward.status,
      });
    }

    return rewards;
  }
}
