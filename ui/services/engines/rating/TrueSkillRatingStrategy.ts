import type { IRatingStrategy, RatingSnapshot, RatingUpdateInput } from "./IRatingStrategy";
import { SimpleRatingStrategy } from "./SimpleRatingStrategy";

/** TrueSkill placeholder — delegates to simple until full Bayesian implementation. */
export class TrueSkillRatingStrategy implements IRatingStrategy {
  readonly name = "trueskill";
  private fallback = new SimpleRatingStrategy();

  updateRating(input: RatingUpdateInput): RatingSnapshot {
    const result = this.fallback.updateRating(input);
    return {
      ...result,
      ratingDeviation: Math.max(25, result.ratingDeviation * 0.95),
    };
  }
}
