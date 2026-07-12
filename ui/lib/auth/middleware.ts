import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { logger } from "@/lib/logging";

export async function authenticatedHandler(
  req: NextRequest,
  handler: (wallet: string, req: NextRequest) => Promise<Response>
): Promise<Response> {
  const session = await getSessionFromRequest(req);

  if (!session) {
    logger.warn("Unauthenticated access attempt", { path: req.nextUrl.pathname });
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    return await handler(session.wallet, req);
  } catch (error) {
    logger.error("Handler error", { error: String(error), path: req.nextUrl.pathname });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function optionalAuthHandler(
  req: NextRequest,
  handler: (wallet: string | undefined, req: NextRequest) => Promise<Response>
): Promise<Response> {
  const session = await getSessionFromRequest(req);

  try {
    return await handler(session?.wallet, req);
  } catch (error) {
    logger.error("Handler error", { error: String(error), path: req.nextUrl.pathname });
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
