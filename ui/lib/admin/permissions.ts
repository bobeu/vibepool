export type AdminRole =
  | "SUPER_ADMIN"
  | "GAME_OPERATOR"
  | "CONTENT_EDITOR"
  | "SUPPORT"
  | "ANALYST"
  | "READ_ONLY";

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  GAME_OPERATOR: ["seasons:write", "campaigns:write", "events:write", "flags:write", "content:write", "banners:write", "scheduler:run"],
  CONTENT_EDITOR: ["content:write", "banners:write", "announcements:write"],
  SUPPORT: ["users:read", "flags:read", "seasons:read"],
  ANALYST: ["analytics:read", "seasons:read", "campaigns:read"],
  READ_ONLY: ["*:read"],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const [resource] = permission.split(":");
  return perms.includes(`${resource}:read`) && permission.endsWith(":read");
}

export function resolveRoleFromEnv(wallet: string): AdminRole | null {
  const normalized = wallet.toLowerCase();
  const superAdmins = (process.env.SUPER_ADMIN_WALLETS ?? process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  if (superAdmins.includes(normalized)) return "SUPER_ADMIN";
  return null;
}
