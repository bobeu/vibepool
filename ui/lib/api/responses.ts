import { AppError } from "@/lib/errors";

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

function toApiError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : "Internal server error";
  return new AppError(500, "INTERNAL_ERROR", message);
}
