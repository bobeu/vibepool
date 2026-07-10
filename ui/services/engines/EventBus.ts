import { EventStore } from "./EventStore";
import type { IEventStore } from "./interfaces";

type Handler = (payload: Record<string, unknown>) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler>>();
  private eventStore: IEventStore;

  constructor(eventStore?: IEventStore) {
    this.eventStore = eventStore || new EventStore();
  }

  publish(event: Record<string, unknown>): void {
    const eventName = event.event as string;
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`EventBus handler error for ${eventName}:`, error);
      }
    }

    this.persist(event).catch(() => {});
  }

  subscribe(eventName: string, handler: Handler): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);

    return () => {
      this.handlers.get(eventName)?.delete(handler);
    };
  }

  private async persist(event: Record<string, unknown>): Promise<void> {
    try {
      await this.eventStore.append({
        aggregateId: (event.aggregateId as string) || event.userId as string || "system",
        aggregateType: (event.aggregateType as string) || "Domain",
        eventType: event.event as string,
        payload: event,
      });
    } catch (error) {
      console.error("EventBus persist error:", error);
    }
  }
}

export const eventBus = new EventBus();
