import type { IRatingStrategy, RatingSnapshot, RatingUpdateInput } from "./IRatingStrategy";

/** Simplified Glicko-style rating update (full Glicko-2 deferred). */
export class GlickoRatingStrategy implements IRatingStrategy {
  readonly name = "glicko";

  updateRating(input: RatingUpdateInput): RatingSnapshot {
    const { player, opponent, outcome } = input;
    const q = Math.log(10) / 400;
    const g = 1 / Math.sqrt(1 + (3 * q * q * opponent.ratingDeviation * opponent.ratingDeviation) / (Math.PI * Math.PI));
    const expected = 1 / (1 + Math.pow(10, (-g * (player.skillRating - opponent.skillRating)) / 400));
    const actual = outcome === "WIN" ? 1 : outcome === "DRAW" ? 0.5 : 0;
    const d2 = 1 / (q * q * g * g * expected * (1 - expected));
    const newRd = Math.min(350, Math.sqrt(player.ratingDeviation * player.ratingDeviation + d2));
    const skillRating = Math.max(100, Math.round(player.skillRating + (q / (1 / (player.ratingDeviation * player.ratingDeviation) + 1 / d2)) * g * (actual - expected)));
    const matchesPlayed = player.matchesPlayed + 1;
    const wins = Math.round(player.winRate * player.matchesPlayed) + (outcome === "WIN" ? 1 : 0);
    const currentStreak = outcome === "WIN" ? player.currentStreak + 1 : 0;
    return {
      skillRating,
      ratingDeviation: newRd,
      matchesPlayed,
      winRate: wins / matchesPlayed,
      currentStreak,
      bestStreak: Math.max(player.bestStreak, currentStreak),
    };
  }
}
