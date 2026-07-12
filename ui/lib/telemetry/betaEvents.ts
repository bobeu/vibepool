import { prisma } from "@/lib/auth/session";
import { TelemetryEngine } from "@/services/engines/observability/ObservabilityEngines";

const telemetry = new TelemetryEngine();

const BETA_EVENTS = [
  "onboarding_complete",
  "first_prediction",
  "first_arena_match",
  "first_spin",
  "first_reward_claim",
  "first_referral",
  "d1_return",
  "d3_return",
  "d7_return",
] as const;

export type BetaEventType = (typeof BETA_EVENTS)[number];

async function hasEmitted(userId: string, eventType: BetaEventType): Promise<boolean> {
  const rows = await prisma().telemetryEvent.findMany({
    where: { source: "analytics", eventType },
    orderBy: { recordedAt: "desc" },
    take: 300,
    select: { payload: true },
  });
  return rows.some((r) => (r.payload as Record<string, unknown> | null)?.userId === userId);
}

export async function trackBetaEvent(
  userId: string,
  eventType: BetaEventType,
  payload?: Record<string, unknown>
): Promise<void> {
  if (await hasEmitted(userId, eventType)) return;
  await telemetry.emit("analytics", eventType, { userId, ...payload });
}

export async function trackRetentionOnLogin(userId: string): Promise<void> {
  const user = await prisma().userProfile.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (!user) return;

  const daysSinceJoin = Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000));
  if (daysSinceJoin >= 1) await trackBetaEvent(userId, "d1_return");
  if (daysSinceJoin >= 3) await trackBetaEvent(userId, "d3_return");
  if (daysSinceJoin >= 7) await trackBetaEvent(userId, "d7_return");
}
