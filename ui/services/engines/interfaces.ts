export interface IEngine {
  name: string;
  execute(input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface IGameEngine extends IEngine {
  orchestrate(tournamentId: string): Promise<Record<string, unknown>>;
}

export interface IPredictionEngine extends IEngine {
  evaluatePredictions(tournamentId: string, actualValue: number): Promise<Record<string, unknown>[]>;
  calculateAccuracy(predictionValue: number, actualValue: number): number;
  validatePredictionData(prediction: Record<string, unknown>): boolean;
}

export interface IScoringEngine extends IEngine {
  calculateScores(predictions: Record<string, unknown>[], settings: Record<string, string>): Promise<Record<string, unknown>[]>;
}

export interface IRankingEngine extends IEngine {
  rankPlayers(scores: Record<string, unknown>[], seed: string): Promise<Record<string, unknown>[]>;
}

export interface IXPRewardEngine extends IEngine {
  calculateXP(settings: Record<string, string>, data: Record<string, unknown>): number;
}

export interface IRewardEngine extends IEngine {
  generatePendingRewards(tournamentId: string, rankedPlayers: Record<string, unknown>[]): Promise<Record<string, unknown>[]>;
}

export interface ISettlementEngine extends IEngine {
  processPendingRewards(limit?: number): Promise<Record<string, unknown>[]>;
  settleReward(rewardId: string): Promise<Record<string, unknown>>;
}

export interface IAuditEngine extends IEngine {
  log(action: string, entity?: string, entityId?: string, metadata?: Record<string, unknown>): Promise<void>;
}
