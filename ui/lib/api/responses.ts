import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging";

export function jsonResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function apiError(error: unknown): Response {
  const appError = toApiError(error);
  return Response.json(
    { error: appError.message, code: appError.code, ...(appError.meta ? { meta: appError.meta } : {}) },
    { status: appError.statusCode }
  );
}

function sanitizeErrorMessage(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("too long for the column")) {
    return "Invalid spin session data. Please retry.";
  }
  if (trimmed.includes("P1017") || /server has closed the connection/i.test(trimmed)) {
    return "Database connection dropped. Please retry in a moment.";
  }
  // Prisma / bundler dumps can be enormous — never echo them to clients or Next logs via Response.
  if (
    trimmed.length > 280 ||
    trimmed.includes("clientVersion") ||
    trimmed.includes("PrismaClientConstructorValidationError") ||
    trimmed.includes("#e;#t;#r")
  ) {
    return "Database request failed. Please retry in a moment.";
  }
  return trimmed || "Internal server error";
}

function toApiError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const raw = error instanceof Error ? error.message : "Internal server error";
  const message = sanitizeErrorMessage(raw);
  if (message !== raw) {
    logger.error("Sanitized oversized API error", {
      preview: raw.slice(0, 160),
      name: error instanceof Error ? error.name : typeof error,
    });
  }
  return new AppError(500, "INTERNAL_ERROR", message);
}
