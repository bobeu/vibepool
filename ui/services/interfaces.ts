export interface IService {
  name: string;
}

export interface IPredictionService extends IService {
  getCurrentRound(wallet?: string): Promise<Record<string, unknown> | null>;
  submitPrediction(wallet: string, payload: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface IMissionService extends IService {
  getDailyMissions(wallet: string): Promise<Record<string, unknown>[]>;
  completeMission(wallet: string, missionId: string): Promise<Record<string, unknown>>;
}

export interface ITournamentService extends IService {
  getActive(): Promise<Record<string, unknown>[]>;
  getById(id: string): Promise<Record<string, unknown> | null>;
}

export interface IRewardService extends IService {
  getClaimable(wallet: string): Promise<Record<string, unknown>[]>;
  claimPoints(wallet: string): Promise<Record<string, unknown>>;
}

export interface IActivityService extends IService {
  record(wallet: string, type: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>>;
  getRecent(wallet: string, limit?: number): Promise<Record<string, unknown>[]>;
}

export interface ISpinService extends IService {
  getAvailableSpins(wallet: string): Promise<Record<string, unknown>>;
  executeSpin(wallet: string): Promise<Record<string, unknown>>;
}

export interface ILeaderboardService extends IService {
  getDaily(limit?: number): Promise<Record<string, unknown>[]>;
  getHistorical(tournamentId?: string): Promise<Record<string, unknown>[]>;
}

export interface INotificationService extends IService {
  getUnread(wallet: string): Promise<Record<string, unknown>[]>;
  markRead(id: string): Promise<void>;
}

export interface IProfileService extends IService {
  getByWallet(wallet: string): Promise<Record<string, unknown> | null>;
  upsert(wallet: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface IBlockchainService extends IService {
  readProfile(wallet: string): Promise<Record<string, unknown> | null>;
  readTreasury(): Promise<Record<string, unknown> | null>;
  submitBackendTransaction(tx: Record<string, unknown>): Promise<string>;
  listenToEvents(): Promise<void>;
  syncLocalCache(): Promise<void>;
  retryFailedTransaction(txHash: string): Promise<string>;
}

export interface ISettingsService extends IService {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getAll(): Promise<Record<string, string>>;
}
