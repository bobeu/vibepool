import { prisma } from "@/lib/auth/session";
import { hasPermission, resolveRoleFromEnv, type AdminRole } from "./permissions";

export async function getAdminRole(wallet: string): Promise<AdminRole | null> {
  const envRole = resolveRoleFromEnv(wallet);
  if (envRole) return envRole;

  const perm = await prisma().adminPermission.findUnique({
    where: { wallet: wallet.toLowerCase() },
  });
  if (!perm?.active) return null;
  return perm.role as AdminRole;
}

export async function requireAdmin(wallet: string, permission: string): Promise<AdminRole> {
  const role = await getAdminRole(wallet);
  if (!role) throw new Error("Forbidden: admin access required");
  if (!hasPermission(role, permission)) throw new Error("Forbidden: insufficient permissions");
  return role;
}
