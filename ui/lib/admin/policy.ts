import { prisma } from "@/lib/auth/session";
import type { AdminRole } from "./permissions";

export type PolicyCondition =
  | { type: "business_hours"; startHourUtc: number; endHourUtc: number }
  | { type: "deny_permission"; permission: string }
  | { type: "allow_permission"; permission: string }
  | { type: "max_concurrent_sessions"; max: number };

const BUILTIN_POLICIES: Array<{ role: AdminRole; permission: string; condition: PolicyCondition }> = [
  {
    role: "GAME_OPERATOR",
    permission: "seasons:write",
    condition: { type: "business_hours", startHourUtc: 9, endHourUtc: 17 },
  },
  {
    role: "FINANCE",
    permission: "scheduler:execute",
    condition: { type: "deny_permission", permission: "scheduler:execute" },
  },
];

function evaluateCondition(condition: PolicyCondition, context?: Record<string, unknown>): boolean {
  switch (condition.type) {
    case "business_hours": {
      const hour = new Date().getUTCHours();
      return hour >= condition.startHourUtc && hour < condition.endHourUtc;
    }
    case "deny_permission":
      return false;
    case "allow_permission":
      return true;
    case "max_concurrent_sessions": {
      const concurrent = Number(context?.concurrentSessions ?? 0);
      return concurrent <= condition.max;
    }
    default:
      return true;
  }
}

export async function evaluatePolicy(
  role: AdminRole,
  permission: string,
  context?: Record<string, unknown>
): Promise<{ allowed: boolean; reason?: string }> {
  const dbPolicies = await prisma().adminPolicy.findMany({
    where: { role, permission, active: true },
  });

  const policies = [
    ...BUILTIN_POLICIES.filter((p) => p.role === role && p.permission === permission),
    ...dbPolicies.map((p) => ({ role: p.role as AdminRole, permission: p.permission, condition: p.condition as PolicyCondition })),
  ];

  if (policies.length === 0) return { allowed: true };

  for (const policy of policies) {
    const ok = evaluateCondition(policy.condition, context);
    if (!ok) {
      return { allowed: false, reason: `Policy blocked: ${policy.condition.type}` };
    }
  }
  return { allowed: true };
}

export async function listPolicies(): Promise<Record<string, unknown>[]> {
  return prisma().adminPolicy.findMany({ orderBy: { createdAt: "desc" } });
}

export async function upsertPolicy(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const row = await prisma().adminPolicy.create({
    data: {
      name: String(data.name ?? "Policy"),
      role: data.role as AdminRole,
      permission: String(data.permission),
      condition: (data.condition as object) ?? { type: "allow_permission", permission: String(data.permission) },
      active: data.active !== false,
    },
  });
  return row as unknown as Record<string, unknown>;
}
