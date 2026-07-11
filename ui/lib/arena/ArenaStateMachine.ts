/** Formal arena match lifecycle state machine — no switch statements in engines. */

export type ArenaState =
  | "WAITING"
  | "ACCEPTED"
  | "COUNTDOWN"
  | "PLAYING"
  | "FINISHED"
  | "SETTLING"
  | "COMPLETED"
  | "ARCHIVED";

export type ArenaEvent =
  | "ACCEPT"
  | "ALL_ACCEPTED"
  | "COUNTDOWN_DONE"
  | "SUBMIT_PREDICTIONS"
  | "FINALIZE"
  | "SETTLE"
  | "COMPLETE"
  | "DECLINE"
  | "EXPIRE";

const TRANSITIONS: Record<ArenaState, Partial<Record<ArenaEvent, ArenaState>>> = {
  WAITING: { ACCEPT: "ACCEPTED", ALL_ACCEPTED: "COUNTDOWN", DECLINE: "ARCHIVED", EXPIRE: "ARCHIVED" },
  ACCEPTED: { ALL_ACCEPTED: "COUNTDOWN", DECLINE: "ARCHIVED", EXPIRE: "ARCHIVED" },
  COUNTDOWN: { COUNTDOWN_DONE: "PLAYING", EXPIRE: "ARCHIVED" },
  PLAYING: { SUBMIT_PREDICTIONS: "FINISHED", EXPIRE: "ARCHIVED" },
  FINISHED: { FINALIZE: "SETTLING" },
  SETTLING: { SETTLE: "COMPLETED" },
  COMPLETED: { COMPLETE: "COMPLETED" },
  ARCHIVED: {},
};

export class ArenaStateMachine {
  constructor(private state: ArenaState = "WAITING") {}

  current(): ArenaState {
    return this.state;
  }

  can(event: ArenaEvent): boolean {
    return Boolean(TRANSITIONS[this.state]?.[event]);
  }

  transition(event: ArenaEvent): ArenaState {
    const next = TRANSITIONS[this.state]?.[event];
    if (!next) {
      throw new Error(`Invalid transition: ${this.state} + ${event}`);
    }
    this.state = next;
    return this.state;
  }

  static definition() {
    return {
      name: "arena-match",
      version: 1,
      states: Object.keys(TRANSITIONS),
      transitions: TRANSITIONS,
    };
  }
}
