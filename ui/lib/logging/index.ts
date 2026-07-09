export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const payload = meta ? { timestamp, level, message, ...meta } : { timestamp, level, message };
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta ?? "");
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
