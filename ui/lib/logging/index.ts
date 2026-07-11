import { getTraceContext } from "@/lib/tracing/context";

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export type LogContext = {
  correlationId?: string;
  requestId?: string;
  traceId?: string;
  userId?: string;
  sessionId?: string;
  environment?: string;
  version?: string;
};

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private baseContext(): LogContext {
    const trace = getTraceContext();
    return {
      correlationId: trace?.correlationId,
      requestId: trace?.requestId,
      traceId: trace?.traceId,
      userId: trace?.userId,
      sessionId: trace?.sessionId,
      environment: process.env.NODE_ENV ?? "development",
      version: process.env.APP_VERSION ?? "1.0.0",
    };
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const payload = { timestamp, level, message, ...this.baseContext(), ...meta };
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, payload);
    }
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (this.level === LogLevel.DEBUG) this.format(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    if ([LogLevel.DEBUG, LogLevel.INFO].includes(this.level)) this.format(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    if ([LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN].includes(this.level)) this.format(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.format(LogLevel.ERROR, message, meta);
  }
}

export const logger = new Logger();
