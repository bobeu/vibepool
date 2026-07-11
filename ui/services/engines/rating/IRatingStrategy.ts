export type RatingSnapshot = {
  skillRating: number;
  ratingDeviation: number;
  matchesPlayed: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
};

export type RatingUpdateInput = {
  player: RatingSnapshot;
  opponent: RatingSnapshot;
  outcome: "WIN" | "LOSS" | "DRAW";
};

export interface IRatingStrategy {
  readonly name: string;
  updateRating(input: RatingUpdateInput): RatingSnapshot;
}
