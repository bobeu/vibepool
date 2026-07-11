import { randomBytes } from "crypto";

export type EventMetadata = {
  correlationId: string;
  requestId: string;
  environment: string;
  region: string;
  schemaVersion: number;
  timestamp: string;
};

const requestContext = new Map<string, EventMetadata>();

export function createEventMetadata(overrides?: Partial<EventMetadata>): EventMetadata {
  return {
    correlationId: overrides?.correlationId ?? randomBytes(16).toString("hex"),
    requestId: overrides?.requestId ?? randomBytes(8).toString("hex"),
    environment: overrides?.environment ?? process.env.NODE_ENV ?? "development",
    region: overrides?.region ?? process.env.NEXORA_REGION ?? "global",
    schemaVersion: overrides?.schemaVersion ?? 1,
    timestamp: overrides?.timestamp ?? new Date().toISOString(),
  };
}

export function setRequestContext(key: string, metadata: EventMetadata): void {
  requestContext.set(key, metadata);
}

export function getRequestContext(key: string): EventMetadata | undefined {
  return requestContext.get(key);
}

export function enrichEvent(
  event: Record<string, unknown>,
  context?: Partial<EventMetadata>
): Record<string, unknown> {
  const meta = createEventMetadata(context);
  return {
    ...event,
    correlationId: event.correlationId ?? meta.correlationId,
    requestId: event.requestId ?? meta.requestId,
    environment: event.environment ?? meta.environment,
    region: event.region ?? meta.region,
    schemaVersion: event.schemaVersion ?? meta.schemaVersion,
    timestamp: event.timestamp ?? meta.timestamp,
  };
}
