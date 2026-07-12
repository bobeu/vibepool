import type { NavKey } from "@/types";

export const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" as NavKey, icon: "home" },
  { href: "/arena", label: "Arena", key: "arena" as NavKey, icon: "arena" },
  { href: "/spin", label: "Spin", key: "spin" as NavKey, icon: "spin" },
  { href: "/rewards", label: "Rewards", key: "rewards" as NavKey, icon: "rewards" },
  { href: "/profile", label: "Profile", key: "profile" as NavKey, icon: "profile" },
] as const;

export const TABLET_NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" as NavKey, icon: "home" },
  { href: "/prediction", label: "Predict", key: "prediction" as NavKey, icon: "predict" },
  { href: "/tournament", label: "Rounds", key: "tournament" as NavKey, icon: "rounds" },
  { href: "/profile", label: "Admin", key: "profile" as NavKey, icon: "admin" },
] as const;

/** Legacy full nav — secondary routes linked from home hub */
export const NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" },
  { href: "/tournament", label: "Tournament", key: "tournament" },
  { href: "/arena", label: "Arena", key: "arena" },
  { href: "/season", label: "Season", key: "season" },
  { href: "/events", label: "Events", key: "events" },
  { href: "/spin", label: "Spin", key: "spin" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  { href: "/friends", label: "Friends", key: "friends" },
  { href: "/community", label: "Community", key: "community" },
  { href: "/profile", label: "Profile", key: "profile" },
] as const;
