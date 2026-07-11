export type TelemetrySource =
  | "arena"
  | "missions"
  | "rewards"
  | "social"
  | "content"
  | "scheduler"
  | "feature_flags"
  | "admin"
  | "analytics"
  | "api"
  | "blockchain";

export type TelemetryEventInput = {
  source: TelemetrySource;
  eventType: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  correlationId?: string;
  durationMs?: number;
  payload?: Record<string, unknown>;
};

export function normalizeTelemetry(input: TelemetryEventInput): Required<Omit<TelemetryEventInput, "payload">> & { payload: Record<string, unknown> } {
  return {
    source: input.source,
    eventType: input.eventType,
    traceId: input.traceId ?? "",
    spanId: input.spanId ?? "",
    parentSpanId: input.parentSpanId ?? "",
    correlationId: input.correlationId ?? "",
    durationMs: input.durationMs ?? 0,
    payload: input.payload ?? {},
  };
}

export const METRIC_CATALOG: Record<string, string> = {
  "users.dau": "Daily active users",
  "users.wau": "Weekly active users",
  "users.mau": "Monthly active users",
  "users.retention": "DAU/MAU retention ratio",
  "arena.queue_latency_ms": "Arena matchmaking queue latency",
  "arena.participation": "Arena match participation count",
  "rewards.settlement_latency_ms": "Reward settlement latency",
  "missions.completion": "Mission completions",
  "spins.engagement": "Spin wheel engagement",
  "referrals.conversion": "Referral conversion rate",
  "scheduler.runtime_ms": "Scheduler job runtime",
  "scheduler.failure_rate": "Scheduler failure rate",
  "scheduler.queue_delay_ms": "Scheduler queue delay",
  "api.latency_ms": "API request latency",
  "db.latency_ms": "Database query latency",
  "rpc.latency_ms": "Blockchain RPC latency",
  "cache.hit_ratio": "Cache hit ratio",
  "events.processing_ms": "Domain event processing time",
  "admin.activity": "Admin console activity count",
};
