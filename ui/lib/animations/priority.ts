const PRIORITY_WEIGHTS: Record<string, number> = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3,
};

export function priorityWeight(priority: unknown): number {
  return PRIORITY_WEIGHTS[(priority as string)?.toUpperCase?.()] ?? 1;
}

export function orderAnimations(animations: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...animations].sort((a, b) => {
    const wa = priorityWeight(a.priority);
    const wb = priorityWeight(b.priority);
    if (wb !== wa) return wb - wa;
    const pa = new Date((a.createdAt as string) ?? 0).getTime();
    const pb = new Date((b.createdAt as string) ?? 0).getTime();
    return pa - pb;
  });
}

export function shouldInterrupt(
  incoming: Record<string, unknown>,
  current: Record<string, unknown> | null
): boolean {
  if (!current) return Boolean(incoming.interrupt);
  const incomingWeight = priorityWeight(incoming.priority);
  const currentWeight = priorityWeight(current.priority);
  if (incomingWeight > currentWeight) return true;
  return Boolean(incoming.interrupt) && incomingWeight >= currentWeight;
}
