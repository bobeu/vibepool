import { randomBytes } from "crypto";
import { AsyncLocalStorage } from "async_hooks";

export type TraceContext = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
};

const storage = new AsyncLocalStorage<TraceContext>();

export function generateId(bytes = 8): string {
  return randomBytes(bytes).toString("hex");
}

export function createTraceContext(partial?: Partial<TraceContext>): TraceContext {
  return {
    traceId: partial?.traceId ?? generateId(16),
    spanId: partial?.spanId ?? generateId(8),
    parentSpanId: partial?.parentSpanId,
    correlationId: partial?.correlationId ?? generateId(8),
    requestId: partial?.requestId ?? generateId(8),
    userId: partial?.userId,
    sessionId: partial?.sessionId,
  };
}

export function runWithTrace<T>(ctx: TraceContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getTraceContext(): TraceContext | undefined {
  return storage.getStore();
}

export function childSpan(operation: string): TraceContext {
  const parent = getTraceContext() ?? createTraceContext();
  return {
    ...parent,
    spanId: generateId(8),
    parentSpanId: parent.spanId,
    requestId: generateId(8),
  };
}

export function traceHeaders(ctx?: TraceContext): Record<string, string> {
  const c = ctx ?? getTraceContext() ?? createTraceContext();
  return {
    "x-trace-id": c.traceId,
    "x-span-id": c.spanId,
    "x-correlation-id": c.correlationId,
    "x-request-id": c.requestId,
  };
}

export type SpanRecord = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  durationMs: number;
  status: string;
  metadata?: Record<string, unknown>;
  startedAt: Date;
};
