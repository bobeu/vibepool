import { prisma } from "@/lib/auth/session";
import { NextRequest } from "next/server";
import { AuditEngine } from "@/services/engines/AuditEngine";
import { hasPermission, resolveRoleFromEnv, type AdminRole } from "./permissions";
import { evaluatePolicy } from "./policy";
import { trackAdminSession } from "./sessionIntelligence";
import { createEventMetadata } from "@/lib/events/metadata";

const auditEngine = new AuditEngine();

export async function getAdminRole(wallet: string): Promise<AdminRole | null> {
  const envRole = resolveRoleFromEnv(wallet);
  if (envRole) return envRole;

  const perm = await prisma().adminPermission.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });
  if (!perm?.active) return null;
  return perm.role as AdminRole;
}

export async function requireAdmin(wallet: string, permission: string, req?: NextRequest): Promise<AdminRole> {
  const role = await getAdminRole(wallet);
  if (!role) throw new Error("Forbidden: admin access required");
  if (!hasPermission(role, permission)) throw new Error("Forbidden: insufficient permissions");

  const concurrentSessions = await prisma().adminSession.count({
    where: { wallet: wallet.toLowerCase(), revoked: false, expiresAt: { gt: new Date() } },
  });

  const policy = await evaluatePolicy(role, permission, { concurrentSessions });
  if (!policy.allowed) throw new Error(`Forbidden: ${policy.reason ?? "policy denied"}`);

  if (req) await trackAdminSession(wallet, role, req);
  return role;
}

export async function auditAdminAction(
  wallet: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const meta = createEventMetadata();
  await auditEngine.log(action, resource, resourceId, { ...metadata, adminWallet: wallet }, wallet, {
    correlationId: meta.correlationId,
    sessionId: meta.requestId,
  });
}
