export type Address = `0x${string}`;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export const USDM_CELO: Address = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

export const NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/tournament", label: "Tournament", key: "tournament" },
  { href: "/spin", label: "Spin", key: "spin" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  { href: "/rewards", label: "Rewards", key: "rewards" },
  { href: "/profile", label: "Profile", key: "profile" },
] as const;

export const XP_PER_LEVEL = 1000;

export const PUBLIC_DATA_REFETCH_MS = 30_000;

export const STALE_TIME_MS = 15_000;
