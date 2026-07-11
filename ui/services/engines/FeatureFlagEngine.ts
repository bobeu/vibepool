import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IFeatureFlagEngine } from "./interfaces";

function hashWallet(wallet: string): number {
  let h = 0;
  for (let i = 0; i < wallet.length; i++) h = (h * 31 + wallet.charCodeAt(i)) >>> 0;
  return h % 100;
}

export class FeatureFlagEngine implements IFeatureFlagEngine {
  name = "FeatureFlagEngine";
  private cache = new Map<string, { value: boolean; expires: number }>();
  private cacheTtlMs = 30_000;

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async isEnabled(key: string, context?: Record<string, unknown>): Promise<boolean> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.value;

    const flag = await prisma().featureFlag.findUnique({ where: { key } });
    if (!flag) {
      this.cache.set(key, { value: true, expires: Date.now() + this.cacheTtlMs });
      return true;
    }

    let enabled = flag.enabled;

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

    this.cache.set(key, { value: enabled, expires: Date.now() + this.cacheTtlMs });
    return enabled;
  }

  async listFlags(): Promise<Record<string, unknown>[]> {
    const flags = await prisma().featureFlag.findMany({ orderBy: { key: "asc" } });
    return flags.map((f) => ({
      key: f.key,
      enabled: f.enabled,
      targetType: f.targetType,
      percentage: f.percentage,
      minipayOnly: f.minipayOnly,
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
        minipayOnly: Boolean(data.minipayOnly),
        metadata: (data.metadata as object) ?? undefined,
      },
      create: {
        key,
        enabled: Boolean(data.enabled),
        targetType: (data.targetType as any) ?? "GLOBAL",
        percentage: data.percentage != null ? Number(data.percentage) : null,
        minipayOnly: Boolean(data.minipayOnly),
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
    return { key: flag.key, enabled: flag.enabled };
  }
}
