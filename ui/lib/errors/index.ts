export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message?: string,
    public meta?: Record<string, unknown>
  ) {
    super(message ?? code);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(400, "VALIDATION_ERROR", message, meta);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "AUTHENTICATION_ERROR", message);
    this.name = "AuthenticationError";
  }
}

export class BlockchainError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(502, "BLOCKCHAIN_ERROR", message, meta);
    this.name = "BlockchainError";
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(500, "DATABASE_ERROR", message, meta);
    this.name = "DatabaseError";
  }
}

export function toApiError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : "Unknown error";
  return new AppError(500, "INTERNAL_ERROR", message);
}
