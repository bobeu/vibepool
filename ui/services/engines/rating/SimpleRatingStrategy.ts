import type { IRatingStrategy, RatingSnapshot, RatingUpdateInput } from "./IRatingStrategy";

/** Pluggable rating strategy — swap for Elo/Glicko/TrueSkill without changing engines. */
export class SimpleRatingStrategy implements IRatingStrategy {
  readonly name = "simple-v1";

  updateRating(input: RatingUpdateInput): RatingSnapshot {
    const { player, opponent, outcome } = input;
    const k = Math.max(16, 32 - player.matchesPlayed * 0.5);
    const expected = 1 / (1 + Math.pow(10, (opponent.skillRating - player.skillRating) / 400));
    const actual = outcome === "WIN" ? 1 : outcome === "DRAW" ? 0.5 : 0;
    const delta = Math.round(k * (actual - expected));

    const skillRating = Math.max(100, player.skillRating + delta);
    const matchesPlayed = player.matchesPlayed + 1;
    const wins = Math.round(player.winRate * player.matchesPlayed) + (outcome === "WIN" ? 1 : 0);
    const winRate = matchesPlayed > 0 ? wins / matchesPlayed : 0;

    let currentStreak = outcome === "WIN" ? player.currentStreak + 1 : outcome === "DRAW" ? player.currentStreak : 0;
    const bestStreak = Math.max(player.bestStreak, currentStreak);
    const ratingDeviation = Math.max(50, player.ratingDeviation * 0.99);

    return {
      skillRating,
      ratingDeviation,
      matchesPlayed,
      winRate,
      currentStreak,
      bestStreak,
    };
  }
}
