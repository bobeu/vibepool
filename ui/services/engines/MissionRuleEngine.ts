import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IMissionRuleEngine } from "./interfaces";

export interface MissionRule {
  missionType: string;
  condition: Record<string, unknown>;
  action: Record<string, unknown>;
}

export class MissionRuleEngine implements IMissionRuleEngine {
  name = "MissionRuleEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async evaluate(activityType: string, metadata?: Record<string, unknown>): Promise<MissionRule[]> {
    const rules = await this.loadRules();
    return rules.filter((rule) => this.matches(rule, activityType, metadata));
  }

  async loadRules(): Promise<MissionRule[]> {
    const missions = await prisma().dailyMission.findMany({
      where: { status: "ACTIVE" },
    });

    const rules: MissionRule[] = [];
    for (const mission of missions) {
      const config = (mission.config || {}) as Record<string, unknown>;
      if (config.rule) {
        rules.push({
          missionType: mission.missionType,
          condition: config.rule as Record<string, unknown>,
          action: { missionId: mission.id },
        });
      }
    }

    return rules;
  }

  private matches(rule: MissionRule, activityType: string, metadata?: Record<string, unknown>): boolean {
    const condition = rule.condition;
    if (!condition || !metadata) {
      return false;
    }

    const requiredActivity = condition.activityType as string;
    if (requiredActivity && requiredActivity !== activityType) {
      return false;
    }

    const requiredKey = condition.metadataKey as string;
    if (requiredKey && !(requiredKey in metadata)) {
      return false;
    }

    return true;
  }
}
