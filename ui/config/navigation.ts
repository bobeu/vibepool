import type { NavKey } from "@/types";

export const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" as NavKey, icon: "home" },
  { href: "/spin", label: "Spin", key: "spin" as NavKey, icon: "spin" },
  { href: "/leaderboard", label: "Ranks", key: "leaderboard" as NavKey, icon: "leaderboard" },
  { href: "/arena", label: "Arena", key: "arena" as NavKey, icon: "arena" },
  { href: "/profile", label: "Profile", key: "profile" as NavKey, icon: "profile" },
] as const;

export const TABLET_NAV_ITEMS = [
  { href: "/", label: "Home", key: "home" as NavKey, icon: "home" },
  { href: "/prediction", label: "Predict", key: "prediction" as NavKey, icon: "prediction" },
  { href: "/arena", label: "Arena", key: "arena" as NavKey, icon: "arena" },
  { href: "/spin", label: "Spin", key: "spin" as NavKey, icon: "spin" },
  { href: "/leaderboard", label: "Ranks", key: "leaderboard" as NavKey, icon: "leaderboard" },
  { href: "/missions", label: "Missions", key: "season" as NavKey, icon: "missions" },
  { href: "/profile", label: "Profile", key: "profile" as NavKey, icon: "profile" },
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
