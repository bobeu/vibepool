export type Address = `0x${string}`;

export type NavKey =
  | "home"
  | "prediction"
  | "spin"
  | "leaderboard"
  | "rewards"
  | "profile";

export interface UserProfile {
  wallet: Address;
  username: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  points: bigint;
  spins: number;
  currentRank: number | null;
}

export interface PredictionRoundSummary {
  roundId: bigint;
  startPrice: bigint;
  endPrice: bigint | null;
  higherPool: bigint;
  lowerPool: bigint;
  isActive: boolean;
}

export interface MissionSummary {
  id: string;
  title: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  wallet: Address;
  username: string | null;
  xp: number;
  points: bigint;
}

export interface SpinState {
  availableSpins: number;
  lastSpinAt: string | null;
}

export interface RewardSummary {
  claimablePoints: bigint;
  treasuryBalance: bigint;
}

/** On-chain prediction data shape — populated in Prompt 2 */
export interface PredictionChainData {
  roundId: bigint;
  higherPool: bigint;
  lowerPool: bigint;
  startPrice: bigint;
  endPrice: bigint | null;
  isRoundActive: boolean;
}

export interface AppChainData {
  owner: Address;
  prediction: PredictionChainData;
}

export interface VibepoolContextValue {
  isConnected: boolean;
  address: Address | undefined;
  chainData: AppChainData | null;
  isLoading: boolean;
  refreshChainData: () => void;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface WalletAuthPayload {
  address: Address;
  message: string;
  signature: `0x${string}`;
  timestamp: number;
}
