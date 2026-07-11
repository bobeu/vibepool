const PRIORITY_WEIGHT: Record<string, number> = {
  LOW: 10,
  NORMAL: 50,
  HIGH: 100,
  PINNED: 200,
};

const TYPE_BOOST: Record<string, number> = {
  ARENA_VICTORY: 40,
  TOURNAMENT: 35,
  ACHIEVEMENT: 30,
  REWARD: 25,
  REFERRAL: 20,
  LEVEL_UP: 15,
  FRIEND_REQUEST: 5,
  PRESENCE: 0,
  SYSTEM: 10,
};

export function feedPriorityWeight(priority: string, type?: string, pinned?: boolean): number {
  const base = PRIORITY_WEIGHT[priority] ?? PRIORITY_WEIGHT.NORMAL;
  const boost = type ? TYPE_BOOST[type] ?? 0 : 0;
  return base + boost + (pinned ? 500 : 0);
}

export function compareFeedItems(
  a: { pinned?: boolean; rankScore?: number; createdAt: Date | string },
  b: { pinned?: boolean; rankScore?: number; createdAt: Date | string }
): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
  const scoreDiff = (b.rankScore ?? 0) - (a.rankScore ?? 0);
  if (scoreDiff !== 0) return scoreDiff;
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  return bTime - aTime;
}
