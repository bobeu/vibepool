import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import { MissionEngine } from "./MissionEngine";
import type { IProgressEngine } from "./interfaces";

export class ProgressEngine implements IProgressEngine {
  name = "ProgressEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async handleActivity(userId: string, activityType: string, metadata?: Record<string, unknown>): Promise<void> {
    const missionUpdates: Promise<Record<string, unknown>>[] = [];
    const missionEngine = new MissionEngine();

    switch (activityType) {
      case "PREDICTION":
        missionUpdates.push(missionEngine.updateProgress(userId, "submit_prediction", 1));
        missionUpdates.push(missionEngine.updateProgress(userId, "submit_three_predictions", 1));
        break;
      case "MISSION":
        missionUpdates.push(missionEngine.updateProgress(userId, "complete_mission", 1));
        break;
      case "REWARD":
        missionUpdates.push(missionEngine.updateProgress(userId, "claim_reward", 1));
        break;
      case "LOGIN":
        missionUpdates.push(missionEngine.updateProgress(userId, "daily_login", 1));
        break;
      case "SPIN":
        missionUpdates.push(missionEngine.updateProgress(userId, "spin_reward", 1));
        break;
      case "TOURNAMENT":
        missionUpdates.push(missionEngine.updateProgress(userId, "complete_tournament", 1));
        break;
      case "SOCIAL":
        missionUpdates.push(missionEngine.updateProgress(userId, "view_leaderboard", 1));
        missionUpdates.push(missionEngine.updateProgress(userId, "visit_profile", 1));
        break;
    }

    await Promise.all(missionUpdates);
  }
}
