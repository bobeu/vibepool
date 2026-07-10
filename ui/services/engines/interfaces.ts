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
  log(action: string, entity?: string, entityId?: string, metadata?: Record<string, unknown>, actor?: string, options?: { eventId?: string; sessionId?: string; correlationId?: string }): Promise<void>;
}

export interface IEventBus {
  publish(event: Record<string, unknown>): void;
  subscribe(eventName: string, handler: (payload: Record<string, unknown>) => void): () => void;
}

export interface IMissionEngine extends IEngine {
  generateDailyMissions(userId: string): Promise<Record<string, unknown>[]>;
  getActiveMissions(userId: string): Promise<Record<string, unknown>[]>;
  updateProgress(userId: string, missionId: string, increment: number): Promise<Record<string, unknown>>;
  completeMission(userId: string, missionId: string): Promise<Record<string, unknown>>;
  claimMission(userId: string, missionId: string): Promise<Record<string, unknown>>;
}

export interface IActivityEngine extends IEngine {
  record(userId: string, type: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>>;
  getRecent(userId: string, limit?: number): Promise<Record<string, unknown>[]>;
}

export interface IProgressEngine extends IEngine {
  handleActivity(userId: string, activityType: string, metadata?: Record<string, unknown>): Promise<void>;
}

export interface IStreakEngine extends IEngine {
  updateStreak(userId: string): Promise<{ current: number; longest: number }>;
  getStreak(userId: string): Promise<{ current: number; longest: number }>;
}

export interface INotificationEngine extends IEngine {
  send(userId: string, type: string, title: string, body: string, priority?: string, expiresAt?: Date, scheduledAt?: Date, recurring?: boolean): Promise<Record<string, unknown>>;
  getUnread(userId: string): Promise<Record<string, unknown>[]>;
  getScheduled(limit?: number): Promise<Record<string, unknown>[]>;
  markRead(notificationId: string, userId: string): Promise<void>;
}

export interface IStatisticsEngine extends IEngine {
  increment(userId: string, type: string, value?: number, metadata?: Record<string, unknown>): Promise<void>;
  getStats(userId: string): Promise<Record<string, unknown>>;
}

export interface IEventStore {
  append(event: { aggregateId: string; aggregateType: string; eventType: string; payload?: Record<string, unknown>; schemaVersion?: number }, version?: number): Promise<string>;
  getEventsForAggregate(aggregateId: string): Promise<Record<string, unknown>[]>;
  getUnprocessed(limit?: number): Promise<Record<string, unknown>[]>;
  markProcessed(eventId: string): Promise<void>;
  replay(filters?: { aggregateId?: string; userId?: string; tournamentId?: string; eventType?: string; startDate?: Date; endDate?: Date }): Promise<Record<string, unknown>[]>;
}

export interface IMissionRuleEngine extends IEngine {
  evaluate(userId: string, activityType: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  loadRules(): Promise<Record<string, unknown>[]>;
}

export interface ISpinEngine extends IEngine {
  grantSpin(userId: string, source: string, reason?: string): Promise<Record<string, unknown>>;
  consumeSpin(userId: string): Promise<boolean>;
  getSpinBalance(userId: string): Promise<{ available: number; daily: number; lifetime: number }>;
}

export interface IWheelEngine extends IEngine {
  generateSpin(userId: string, randomProvider: IRandomProvider): Promise<Record<string, unknown>>;
  generateReward(spinId: string, randomProvider: IRandomProvider): Promise<Record<string, unknown>>;
  getSpinHistory(userId: string, limit?: number): Promise<Record<string, unknown>[]>;
}

export interface IRewardClaimEngine extends IEngine {
  claimReward(userId: string, rewardId: string): Promise<Record<string, unknown>>;
  getClaimableRewards(userId: string): Promise<Record<string, unknown>[]>;
}

export interface IGamificationEngine extends IEngine {
  getLevelProgress(userId: string): Promise<Record<string, unknown>>;
  getPlayerRank(userId: string): Promise<Record<string, unknown>>;
  getEngagementMetrics(userId: string): Promise<Record<string, unknown>>;
}

export interface IAchievementEngine extends IEngine {
  evaluateAchievements(userId: string): Promise<Record<string, unknown>[]>;
  getAchievements(userId: string): Promise<Record<string, unknown>[]>;
  getAchievementProgress(userId: string, achievementId: string): Promise<Record<string, unknown>>;
  unlockAchievement(userId: string, achievementId: string): Promise<Record<string, unknown>>;
}

export interface IIdentityEngine extends IEngine {
  getIdentity(userId: string): Promise<Record<string, unknown>>;
  updateIdentity(userId: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface IProgressionEngine extends IEngine {
  getProgression(userId: string): Promise<Record<string, unknown>>;
  snapshotProgress(userId: string, type: string): Promise<Record<string, unknown>>;
}

export interface ITitleEngine extends IEngine {
  getAvailableTitles(userId: string): Promise<Record<string, unknown>[]>;
  equipTitle(userId: string, titleSlug: string): Promise<Record<string, unknown>>;
}

export interface IBadgeEngine extends IEngine {
  getAvailableBadges(userId: string): Promise<Record<string, unknown>[]>;
  equipBadge(userId: string, badgeSlug: string): Promise<Record<string, unknown>>;
}

export interface IRandomProvider {
  next(): Promise<number>;
  range(min: number, max: number): Promise<number>;
  shuffle<T>(items: T[]): Promise<T[]>;
}
