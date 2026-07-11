import { SchedulerEngine } from "@/services/engines/SchedulerEngine";
import { SeasonEngine } from "@/services/engines/SeasonEngine";
import { CampaignEngine } from "@/services/engines/CampaignEngine";
import { LiveOpsEngine } from "@/services/engines/LiveOpsEngine";

let schedulerEngine: SchedulerEngine | null = null;

function registerHandlers(engine: SchedulerEngine): void {
  const seasonEngine = new SeasonEngine();
  const campaignEngine = new CampaignEngine();
  const liveOpsEngine = new LiveOpsEngine();

  engine.registerHandler("SEASON_ROLLOVER", async (_payload, options) => {
    if (options?.dryRun) return { simulated: true, action: "season_rollover" };
    return seasonEngine.rollover();
  });
  engine.registerHandler("CAMPAIGN_START", async (payload, options) => {
    if (options?.dryRun) return { simulated: true, action: "campaign_start", campaignId: payload.campaignId };
    const id = payload.campaignId as string;
    return id ? campaignEngine.startCampaign(id) : { skipped: true };
  });
  engine.registerHandler("CAMPAIGN_END", async (payload, options) => {
    if (options?.dryRun) return { simulated: true, action: "campaign_end", campaignId: payload.campaignId };
    const id = payload.campaignId as string;
    return id ? campaignEngine.completeCampaign(id) : { skipped: true };
  });
  engine.registerHandler("CLEANUP", async (_payload, options) => {
    if (options?.dryRun) return { simulated: true, action: "cleanup" };
    const { MatchEngine } = await import("@/services/engines/MatchEngine");
    const { MatchmakingEngine } = await import("@/services/engines/MatchmakingEngine");
    const matchEngine = new MatchEngine();
    const matchmakingEngine = new MatchmakingEngine();
    const expiredMatches = await matchEngine.expireWaitingMatches();
    const expiredQueues = await matchmakingEngine.expireStaleQueues();
    const activatedEvents = await liveOpsEngine.activateDueEvents();
    const activatedCampaigns = await campaignEngine.activateDueCampaigns();
    return { expiredMatches, expiredQueues, activatedEvents, activatedCampaigns };
  });
}

/** Singleton scheduler with all production job handlers registered. */
export function getSchedulerEngine(): SchedulerEngine {
  if (!schedulerEngine) {
    schedulerEngine = new SchedulerEngine();
    registerHandlers(schedulerEngine);
  }
  return schedulerEngine;
}
