export const QUEUE_TIMEOUT_MS = Number(process.env.ARENA_QUEUE_TIMEOUT_MS ?? 60_000);
export const MATCH_ACCEPT_TIMEOUT_MS = Number(process.env.ARENA_ACCEPT_TIMEOUT_MS ?? 30_000);
export const INVITE_EXPIRY_MS = Number(process.env.ARENA_INVITE_EXPIRY_MS ?? 24 * 60 * 60 * 1000);
export const COUNTDOWN_SECONDS = 3;
export const CURRENT_SEASON = Number(process.env.ARENA_SEASON ?? 1);
export const DEFAULT_RATING = 1000;
export const ARENA_XP_WIN = 50;
export const ARENA_XP_LOSS = 15;
export const ARENA_POINTS_WIN = 100;

export const LEAGUE_THRESHOLDS = [
  { league: "LEGEND", min: 1800 },
  { league: "DIAMOND", min: 1600 },
  { league: "PLATINUM", min: 1400 },
  { league: "GOLD", min: 1200 },
  { league: "SILVER", min: 1100 },
  { league: "BRONZE", min: 0 },
] as const;

export function leagueForRating(rating: number): string {
  for (const entry of LEAGUE_THRESHOLDS) {
    if (rating >= entry.min) return entry.league;
  }
  return "BRONZE";
}
