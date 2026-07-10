import { ASSETS, type AssetManifest as Manifest } from "@/assets/index";

export type AssetRef = {
  src: string;
  type: "image/webp" | "image/svg" | "image/png";
  theme?: "dark" | "light" | "all";
};

export type AssetCategory = "hero" | "background" | "icon" | "illustration" | "avatar" | "effect" | "logo" | "badge" | "title" | "card";

type ThemeAssets = Record<string, AssetRef>;

const BASE: Record<AssetCategory, Record<string, AssetRef>> = {
  hero: {
    arena: { src: ASSETS.HEROES.arena, type: "image/webp", theme: "all" },
    tournament: { src: ASSETS.HEROES.tournament, type: "image/webp", theme: "all" },
    leaderboard: { src: ASSETS.HEROES.leaderboard, type: "image/webp", theme: "all" },
    rewards: { src: ASSETS.HEROES.rewards, type: "image/webp", theme: "all" },
    missions: { src: ASSETS.HEROES.missions, type: "image/webp", theme: "all" },
    spin: { src: ASSETS.HEROES.spin, type: "image/webp", theme: "all" },
    profile: { src: ASSETS.HEROES.profile, type: "image/webp", theme: "all" },
    seasonPass: { src: ASSETS.HEROES.seasonPass, type: "image/webp", theme: "all" },
    comingSoon: { src: ASSETS.HEROES.comingSoon, type: "image/webp", theme: "all" },
    referral: { src: ASSETS.HEROES.referral, type: "image/webp", theme: "all" },
  },
  background: {
    dark: { src: ASSETS.BACKGROUNDS.dark, type: "image/webp", theme: "dark" },
    light: { src: ASSETS.BACKGROUNDS.light, type: "image/webp", theme: "light" },
    tournament: { src: ASSETS.BACKGROUNDS.tournament, type: "image/webp", theme: "all" },
    spin: { src: ASSETS.BACKGROUNDS.spin, type: "image/webp", theme: "all" },
  },
  icon: {
    trophy: { src: ASSETS.ICONS.trophy, type: "image/svg", theme: "all" },
    sparkles: { src: ASSETS.ICONS.sparkles, type: "image/svg", theme: "all" },
    flame: { src: ASSETS.ICONS.flame, type: "image/svg", theme: "all" },
    shield: { src: ASSETS.ICONS.shield, type: "image/svg", theme: "all" },
    bolt: { src: ASSETS.ICONS.bolt, type: "image/svg", theme: "all" },
  },
  illustration: {
    emptyState: { src: ASSETS.ILLUSTRATIONS.emptyState, type: "image/webp", theme: "all" },
    noRewards: { src: ASSETS.ILLUSTRATIONS.noRewards, type: "image/webp", theme: "all" },
    noMissions: { src: ASSETS.ILLUSTRATIONS.noMissions, type: "image/webp", theme: "all" },
  },
  avatar: {
    default: { src: ASSETS.AVATARS.default, type: "image/webp", theme: "all" },
    frame1: { src: ASSETS.AVATARS.frame1, type: "image/webp", theme: "all" },
    frame2: { src: ASSETS.AVATARS.frame2, type: "image/webp", theme: "all" },
  },
  effect: {
    confetti: { src: ASSETS.EFFECTS.confetti, type: "image/webp", theme: "all" },
    particles: { src: ASSETS.EFFECTS.particles, type: "image/webp", theme: "all" },
    glow: { src: ASSETS.EFFECTS.glow, type: "image/webp", theme: "all" },
  },
  logo: {
    mark: { src: ASSETS.LOGOS.mark, type: "image/svg", theme: "all" },
    wordmark: { src: ASSETS.LOGOS.wordmark, type: "image/svg", theme: "all" },
    icon: { src: ASSETS.LOGOS.icon, type: "image/svg", theme: "all" },
  },
  badge: {
    bronze: { src: ASSETS.BADGES.bronze, type: "image/svg", theme: "all" },
    silver: { src: ASSETS.BADGES.silver, type: "image/svg", theme: "all" },
    gold: { src: ASSETS.BADGES.gold, type: "image/svg", theme: "all" },
    diamond: { src: ASSETS.BADGES.diamond, type: "image/svg", theme: "all" },
    master: { src: ASSETS.BADGES.master, type: "image/svg", theme: "all" },
    legend: { src: ASSETS.BADGES.legend, type: "image/svg", theme: "all" },
  },
  title: {
    explorer: { src: ASSETS.TITLES.explorer, type: "image/svg", theme: "all" },
    challenger: { src: ASSETS.TITLES.challenger, type: "image/svg", theme: "all" },
    conqueror: { src: ASSETS.TITLES.conqueror, type: "image/svg", theme: "all" },
    elite: { src: ASSETS.TITLES.elite, type: "image/svg", theme: "all" },
    champion: { src: ASSETS.TITLES.champion, type: "image/svg", theme: "all" },
    legend: { src: ASSETS.TITLES.legend, type: "image/svg", theme: "all" },
  },
  card: {
    tournament: { src: ASSETS.CARDS.tournament, type: "image/webp", theme: "all" },
    mission: { src: ASSETS.CARDS.mission, type: "image/webp", theme: "all" },
    reward: { src: ASSETS.CARDS.reward, type: "image/webp", theme: "all" },
    achievement: { src: ASSETS.CARDS.achievement, type: "image/webp", theme: "all" },
  },
};

const SEASONAL_OVERRIDES: Record<string, ThemeAssets> = {};

export function resolveAsset(category: AssetCategory, name: string, theme: string = "all"): AssetRef | null {
  const overrides = SEASONAL_OVERRIDES[theme];
  const candidate = overrides?.[category]?.[name];
  if (candidate) return candidate;
  return BASE[category]?.[name] ?? null;
}

export function withTheme(theme: string, manifest: Manifest = ASSETS): Manifest {
  return {
    ...manifest,
    HEROES: manifest.HEROES,
  };
}

export const assetManifest = {
  get: <K extends AssetCategory>(category: K, name: string) => {
    const asset = BASE[category]?.[name];
    if (!asset) return null;
    return asset;
  },
  resolve: (category: AssetCategory, name: string, theme = "all") => resolveAsset(category, name, theme),
};
