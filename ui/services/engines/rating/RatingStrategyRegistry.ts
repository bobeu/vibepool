import type { IRatingStrategy } from "./IRatingStrategy";
import { SimpleRatingStrategy } from "./SimpleRatingStrategy";
import { EloRatingStrategy } from "./EloRatingStrategy";
import { GlickoRatingStrategy } from "./GlickoRatingStrategy";
import { TrueSkillRatingStrategy } from "./TrueSkillRatingStrategy";
import { isRuntimeEnabled } from "@/lib/runtime/productionConfig";

const strategies = new Map<string, IRatingStrategy>([
  ["simple", new SimpleRatingStrategy()],
]);

let experimentalLoaded = false;

function registerExperimentalStrategies(): void {
  if (experimentalLoaded) return;
  experimentalLoaded = true;
  strategies.set("elo", new EloRatingStrategy());
  strategies.set("glicko", new GlickoRatingStrategy());
  strategies.set("trueskill", new TrueSkillRatingStrategy());
}

const ACTIVE_STRATEGY = process.env.ARENA_RATING_STRATEGY ?? "simple";

export class RatingStrategyRegistry {
  static register(name: string, strategy: IRatingStrategy): void {
    strategies.set(name, strategy);
  }

  static get(name?: string): IRatingStrategy {
    const key = name ?? ACTIVE_STRATEGY;
    if (key !== "simple" && !strategies.has(key)) {
      registerExperimentalStrategies();
    }
    if (isRuntimeEnabled("enableExperimentalRatingStrategies") && !experimentalLoaded) {
      registerExperimentalStrategies();
    }
    return strategies.get(key) ?? strategies.get("simple")!;
  }

  static list(): string[] {
    return Array.from(strategies.keys());
  }
}
