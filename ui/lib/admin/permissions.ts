export type AdminRole =
  | "SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "GAME_OPERATOR"
  | "CONTENT_EDITOR"
  | "SUPPORT"
  | "ANALYST"
  | "FINANCE"
  | "READ_ONLY";

export type AdminResource =
  | "seasons"
  | "arena"
  | "users"
  | "rewards"
  | "campaigns"
  | "flags"
  | "content"
  | "moderation"
  | "analytics"
  | "scheduler"
  | "audit"
  | "events"
  | "banners";

export type AdminAction = "read" | "write" | "execute" | "delete";

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  SUPER_ADMIN: ["*"],
  PLATFORM_ADMIN: [
    "seasons:read", "seasons:write",
    "arena:read", "arena:write", "arena:execute",
    "users:read", "users:write",
    "rewards:read", "rewards:write", "rewards:execute",
    "campaigns:read", "campaigns:write",
    "flags:read", "flags:write",
    "content:read", "content:write",
    "moderation:read", "moderation:write",
    "analytics:read",
    "scheduler:read", "scheduler:execute",
    "audit:read",
    "events:write", "banners:write",
  ],
  GAME_OPERATOR: [
    "seasons:read", "seasons:write",
    "arena:read", "arena:execute",
    "campaigns:read", "campaigns:write",
    "flags:read", "flags:write",
    "events:write", "scheduler:read", "scheduler:execute",
    "analytics:read",
  ],
  CONTENT_EDITOR: ["content:read", "content:write", "banners:write", "events:write", "campaigns:read"],
  SUPPORT: ["users:read", "users:write", "moderation:read", "moderation:write", "flags:read", "audit:read"],
  ANALYST: ["analytics:read", "seasons:read", "campaigns:read", "arena:read", "audit:read"],
  FINANCE: ["rewards:read", "rewards:write", "rewards:execute", "analytics:read", "audit:read"],
  READ_ONLY: ["*:read"],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const [resource, action] = permission.split(":");
  if (action === "read" && perms.includes(`${resource}:read`)) return true;
  if (perms.includes(`${resource}:write`) && ["write", "execute", "delete"].includes(action ?? "")) return false;
  return perms.includes(`${resource}:read`) && permission.endsWith(":read");
}

export function permissionFor(resource: AdminResource, action: AdminAction): string {
  return `${resource}:${action}`;
}

export function resolveRoleFromEnv(wallet: string): AdminRole | null {
  const normalized = wallet.toLowerCase();
  const superAdmins = (process.env.SUPER_ADMIN_WALLETS ?? process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  if (superAdmins.includes(normalized)) return "SUPER_ADMIN";

  const platformAdmins = (process.env.PLATFORM_ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
  if (platformAdmins.includes(normalized)) return "PLATFORM_ADMIN";

  return null;
}
