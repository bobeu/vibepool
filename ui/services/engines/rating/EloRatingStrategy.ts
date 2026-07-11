import type { IRatingStrategy, RatingSnapshot, RatingUpdateInput } from "./IRatingStrategy";

export class EloRatingStrategy implements IRatingStrategy {
  readonly name = "elo";

  updateRating(input: RatingUpdateInput): RatingSnapshot {
    const { player, opponent, outcome } = input;
    const k = 32;
    const expected = 1 / (1 + Math.pow(10, (opponent.skillRating - player.skillRating) / 400));
    const actual = outcome === "WIN" ? 1 : outcome === "DRAW" ? 0.5 : 0;
    const skillRating = Math.max(100, player.skillRating + Math.round(k * (actual - expected)));
    const matchesPlayed = player.matchesPlayed + 1;
    const wins = Math.round(player.winRate * player.matchesPlayed) + (outcome === "WIN" ? 1 : 0);
    const currentStreak = outcome === "WIN" ? player.currentStreak + 1 : outcome === "DRAW" ? player.currentStreak : 0;
    return {
      skillRating,
      ratingDeviation: player.ratingDeviation,
      matchesPlayed,
      winRate: wins / matchesPlayed,
      currentStreak,
      bestStreak: Math.max(player.bestStreak, currentStreak),
    };
  }
}
