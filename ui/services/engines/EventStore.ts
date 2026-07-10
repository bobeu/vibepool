import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import type { IEventStore } from "./interfaces";

export interface DomainEvent {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload?: Record<string, unknown>;
  schemaVersion?: number;
}

export class EventStore implements IEventStore {
  name = "EventStore";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async append(event: DomainEvent, version?: number): Promise<string> {
    const record = await prisma().domainEvent.create({
      data: {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        payload: event.payload,
        version: version || 1,
      },
    });

    logger.info("Event persisted", { eventId: record.id, eventType: event.eventType });
    return record.id;
  }

  async getEventsForAggregate(aggregateId: string): Promise<Record<string, unknown>[]> {
    const events = await prisma().domainEvent.findMany({
      where: { aggregateId },
      orderBy: { occurredAt: "asc" },
    });

    return events.map((e) => ({
      id: e.id,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      eventType: e.eventType,
      payload: e.payload,
      version: e.version,
      processed: e.processed,
      occurredAt: e.occurredAt,
    }));
  }

  async getUnprocessed(limit = 100): Promise<Record<string, unknown>[]> {
    const events = await prisma().domainEvent.findMany({
      where: { processed: false },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });

    return events.map((e) => ({
      id: e.id,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      eventType: e.eventType,
      payload: e.payload,
      version: e.version,
      occurredAt: e.occurredAt,
    }));
  }

  async markProcessed(eventId: string): Promise<void> {
    await prisma().domainEvent.update({
      where: { id: eventId },
      data: { processed: true },
    });
  }

  async replay(filters?: {
    aggregateId?: string;
    userId?: string;
    tournamentId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Record<string, unknown>[]> {
    const where: Record<string, unknown> = {};

    if (filters?.aggregateId) {
      where.aggregateId = filters.aggregateId;
    }

    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters?.startDate || filters?.endDate) {
      const occurredAt: Record<string, Date> = {};
      if (filters.startDate) occurredAt.gte = filters.startDate;
      if (filters.endDate) occurredAt.lte = filters.endDate;
      where.occurredAt = occurredAt;
    }

    const events = await prisma().domainEvent.findMany({
      where,
      orderBy: { occurredAt: "asc" },
    });

    const results = events.map((e) => ({
      id: e.id,
      aggregateId: e.aggregateId,
      aggregateType: e.aggregateType,
      eventType: e.eventType,
      payload: e.payload,
      version: e.version,
      processed: e.processed,
      occurredAt: e.occurredAt,
    }));

    if (filters?.userId || filters?.tournamentId) {
      return results.filter((e) => {
        const payload = e.payload as Record<string, unknown> || {};
        if (filters.userId && payload.userId !== filters.userId) return false;
        if (filters.tournamentId && payload.tournamentId !== filters.tournamentId) return false;
        return true;
      });
    }

    return results;
  }
}
