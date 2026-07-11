export type AnimationDefinition = {
  type: string;
  priority: string;
  interrupt: boolean;
  component?: string;
  durationMs?: number;
};

const registry = new Map<string, AnimationDefinition>();

const DEFAULTS: AnimationDefinition[] = [
  { type: "ACHIEVEMENT_LEGENDARY", priority: "URGENT", interrupt: true, component: "AchievementUnlock", durationMs: 4000 },
  { type: "ACHIEVEMENT_EPIC", priority: "HIGH", interrupt: true, component: "AchievementUnlock", durationMs: 3500 },
  { type: "ACHIEVEMENT", priority: "NORMAL", interrupt: false, component: "AchievementUnlock", durationMs: 3000 },
  { type: "BADGE", priority: "HIGH", interrupt: true, component: "BadgeUnlock", durationMs: 2500 },
  { type: "TITLE", priority: "NORMAL", interrupt: false, component: "TitleUnlock", durationMs: 2500 },
  { type: "LEVEL_UP", priority: "HIGH", interrupt: true, component: "LevelUp", durationMs: 3000 },
  { type: "REWARD", priority: "NORMAL", interrupt: false, component: "RewardReveal", durationMs: 2500 },
  { type: "XP", priority: "LOW", interrupt: false, component: "XPGain", durationMs: 1500 },
  { type: "ARENA_VICTORY", priority: "URGENT", interrupt: true, component: "ArenaVictory", durationMs: 4000 },
  { type: "ARENA_DEFEAT", priority: "HIGH", interrupt: false, component: "ArenaDefeat", durationMs: 3000 },
  { type: "ARENA_DRAW", priority: "NORMAL", interrupt: false, component: "ArenaDraw", durationMs: 2500 },
  { type: "ARENA_RATING_UP", priority: "HIGH", interrupt: true, component: "RatingIncrease", durationMs: 3000 },
  { type: "ARENA_COUNTDOWN", priority: "LOW", interrupt: false, component: "ArenaCountdown", durationMs: 3000 },
];

for (const def of DEFAULTS) {
  registry.set(def.type, def);
}

export function registerAnimation(def: AnimationDefinition): void {
  registry.set(def.type, def);
}

export function getAnimationDefinition(type: string, rarity?: string): AnimationDefinition {
  if (type === "ACHIEVEMENT" && rarity === "LEGENDARY") return registry.get("ACHIEVEMENT_LEGENDARY")!;
  if (type === "ACHIEVEMENT" && rarity === "EPIC") return registry.get("ACHIEVEMENT_EPIC")!;
  return registry.get(type) ?? { type, priority: "NORMAL", interrupt: false };
}

export function listAnimationDefinitions(): AnimationDefinition[] {
  return Array.from(registry.values());
}
