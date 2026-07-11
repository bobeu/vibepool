import type { IRatingStrategy } from "./IRatingStrategy";
import { SimpleRatingStrategy } from "./SimpleRatingStrategy";
import { EloRatingStrategy } from "./EloRatingStrategy";
import { GlickoRatingStrategy } from "./GlickoRatingStrategy";
import { TrueSkillRatingStrategy } from "./TrueSkillRatingStrategy";

const strategies = new Map<string, IRatingStrategy>([
  ["simple", new SimpleRatingStrategy()],
  ["elo", new EloRatingStrategy()],
  ["glicko", new GlickoRatingStrategy()],
  ["trueskill", new TrueSkillRatingStrategy()],
]);

const ACTIVE_STRATEGY = process.env.ARENA_RATING_STRATEGY ?? "simple";

export class RatingStrategyRegistry {
  static register(name: string, strategy: IRatingStrategy): void {
    strategies.set(name, strategy);
  }

  static get(name?: string): IRatingStrategy {
    const key = name ?? ACTIVE_STRATEGY;
    return strategies.get(key) ?? strategies.get("simple")!;
  }

  static list(): string[] {
    return Array.from(strategies.keys());
  }
}
