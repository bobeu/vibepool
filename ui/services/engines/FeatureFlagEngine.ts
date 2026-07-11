import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IFeatureFlagEngine } from "./interfaces";

function hashWallet(wallet: string): number {
  let h = 0;
  for (let i = 0; i < wallet.length; i++) h = (h * 31 + wallet.charCodeAt(i)) >>> 0;
  return h % 100;
}

type ExperimentGroups = Record<string, number>;

function resolveExperimentGroup(wallet: string, groups: ExperimentGroups): string | null {
  const bucket = hashWallet(wallet);
  let cumulative = 0;
  for (const [group, pct] of Object.entries(groups)) {
    cumulative += pct;
    if (bucket < cumulative) return group;
  }
  return null;
}

export class FeatureFlagEngine implements IFeatureFlagEngine {
  name = "FeatureFlagEngine";
  private cache = new Map<string, { value: boolean; expires: number }>();
  private cacheTtlMs = 30_000;

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async isEnabled(key: string, context?: Record<string, unknown>): Promise<boolean> {
    const result = await this.evaluate(key, context);
    return result.enabled;
  }

  async evaluate(key: string, context?: Record<string, unknown>): Promise<Record<string, unknown>> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return { key, enabled: cached.value };
    }

    const flag = await prisma().featureFlag.findUnique({ where: { key } });
    if (!flag) {
      this.cache.set(key, { value: true, expires: Date.now() + this.cacheTtlMs });
      return { key, enabled: true, default: true };
    }

    let enabled = flag.enabled;
    let experimentGroup: string | null = null;

    if (enabled && flag.targetType === "EXPERIMENT" && flag.experimentGroups) {
      const wallet = context?.wallet as string | undefined;
      const groups = flag.experimentGroups as ExperimentGroups;
      if (wallet) {
        experimentGroup = resolveExperimentGroup(wallet, groups);
        enabled = experimentGroup !== null && experimentGroup !== "control";
      } else {
        enabled = false;
      }
    }

    if (enabled && flag.targetType === "PERCENTAGE" && flag.percentage != null) {
      const wallet = context?.wallet as string | undefined;
      enabled = wallet ? hashWallet(wallet) < flag.percentage : false;
    }

    if (enabled && flag.targetType === "WHITELIST" && flag.whitelist) {
      const wallet = (context?.wallet as string)?.toLowerCase();
      const list = flag.whitelist as string[];
      enabled = wallet ? list.map((w) => w.toLowerCase()).includes(wallet) : false;
    }

    if (enabled && flag.minipayOnly && !context?.minipay) {
      enabled = false;
    }

    if (enabled && flag.environments) {
      const env = process.env.NODE_ENV ?? "development";
      const allowed = flag.environments as string[];
      enabled = allowed.includes(env);
    }

    if (enabled && flag.regions && context?.region) {
      const allowed = flag.regions as string[];
      enabled = allowed.includes(context.region as string);
    }

    this.cache.set(key, { value: enabled, expires: Date.now() + this.cacheTtlMs });
    return { key, enabled, experimentGroup, targetType: flag.targetType };
  }

  async listFlags(): Promise<Record<string, unknown>[]> {
    const flags = await prisma().featureFlag.findMany({ orderBy: { key: "asc" } });
    return flags.map((f) => ({
      key: f.key,
      enabled: f.enabled,
      targetType: f.targetType,
      percentage: f.percentage,
      minipayOnly: f.minipayOnly,
      experimentGroups: f.experimentGroups,
      regions: f.regions,
      environments: f.environments,
    }));
  }

  async upsertFlag(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    const key = data.key as string;
    const flag = await prisma().featureFlag.upsert({
      where: { key },
      update: {
        enabled: Boolean(data.enabled),
        targetType: (data.targetType as any) ?? "GLOBAL",
        percentage: data.percentage != null ? Number(data.percentage) : null,
        whitelist: (data.whitelist as object) ?? undefined,
        regions: (data.regions as object) ?? undefined,
        environments: (data.environments as object) ?? undefined,
        experimentGroups: (data.experimentGroups as object) ?? undefined,
        minipayOnly: Boolean(data.minipayOnly),
        metadata: (data.metadata as object) ?? undefined,
      },
      create: {
        key,
        enabled: Boolean(data.enabled),
        targetType: (data.targetType as any) ?? "GLOBAL",
        percentage: data.percentage != null ? Number(data.percentage) : null,
        minipayOnly: Boolean(data.minipayOnly),
        experimentGroups: (data.experimentGroups as object) ?? undefined,
      },
    });

    this.cache.delete(key);

    eventBus.publish({
      event: "FeatureFlagChanged",
      aggregateId: flag.id,
      aggregateType: "FeatureFlag",
      key: flag.key,
      enabled: flag.enabled,
    });

    logger.info("Feature flag updated", { key });
    return { key: flag.key, enabled: flag.enabled, targetType: flag.targetType };
  }

  async previewImpact(key: string): Promise<Record<string, unknown>> {
    const flag = await prisma().featureFlag.findUnique({ where: { key } });
    if (!flag) return { key, impact: "unknown" };

    if (flag.targetType === "PERCENTAGE" && flag.percentage != null) {
      return { key, estimatedReach: `${flag.percentage}%`, targetType: flag.targetType };
    }
    if (flag.targetType === "EXPERIMENT" && flag.experimentGroups) {
      return { key, groups: flag.experimentGroups, targetType: flag.targetType };
    }
    return { key, targetType: flag.targetType, enabled: flag.enabled };
  }
}
