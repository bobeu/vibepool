// Client-side types placeholder (replace with generated Prisma types)
export type Address = `0x${string}`;
export type UUID = string;

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type TournamentStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PredictionStatus = "PENDING" | "EVALUATED" | "REWARDED";
export type MissionStatus = "ACTIVE" | "COMPLETED" | "EXPIRED";
export type NotificationType = "INFO" | "REWARD" | "SYSTEM" | "ALERT";
export type ActivityType =
  | "LOGIN"
  | "PREDICTION"
  | "MISSION"
  | "SPIN"
  | "REWARD"
  | "SOCIAL"
  | "TOURNAMENT";
export type SpinType = "DAILY" | "REWARD" | "PURCHASE" | "EVENT";

export interface UserProfile {
  id: string;
  wallet: string;
  username: string | null;
  avatar: string | null;
  xp: number;
  points: number;
  spins: number;
  level: number;
  currentRank: number | null;
  lastLogin: Date | null;
  totalActivity: number;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tournament {
  id: string;
  name: string;
  startTime: Date;
  endTime: Date;
  status: TournamentStatus;
  rewardPool: number;
  asset: string;
  maxPlayers: number;
  currentPlayers: number;
  seasonNumber: number;
  dailyNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prediction {
  id: string;
  tournamentId: string;
  userId: string;
  predictionValue: number;
  submittedValue: number | null;
  actualValue: number | null;
  accuracy: number | null;
  rankPoints: number;
  xpAwarded: number;
  status: PredictionStatus;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointReward: number;
  spinReward: number;
  missionType: string;
  status: MissionStatus;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  completed: boolean;
  completedAt: Date | null;
  rewardClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpinLedger {
  id: string;
  userId: string;
  spinType: SpinType;
  amount: number;
  reason: string | null;
  transactionHash: string | null;
  createdAt: Date;
}

export interface RewardLedger {
  id: string;
  userId: string;
  reward: string;
  asset: string;
  amount: number;
  reason: string | null;
  transactionHash: string | null;
  treasuryRequestId: string | null;
  createdAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface LeaderboardSnapshot {
  id: string;
  tournamentId: string | null;
  userId: string;
  rank: number;
  xp: number;
  points: number;
  predictionAccuracy: number | null;
  snapshotTime: Date;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  updatedAt: Date;
}
