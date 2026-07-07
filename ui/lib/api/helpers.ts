import type { NextRequest } from "next/server";
import type { ApiErrorResponse } from "@/types";

export function notImplemented(module: string): Response {
  return Response.json(
    { error: `${module} not implemented — Phase 1 Prompt 2`, code: "NOT_IMPLEMENTED" } satisfies ApiErrorResponse,
    { status: 501 }
  );
}

export function getWalletFromRequest(req: NextRequest): string | null {
  return req.headers.get("x-wallet-address");
}

/** Rate limiting strategy (design only — in-memory stub for Prompt 1) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  windowMs = 60_000,
  max = 30
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true };
}
