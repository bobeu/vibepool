import { NextRequest } from "next/server";
import { prisma } from "@/lib/auth/session";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";

export const GET = (req: NextRequest) =>
  adminHandler(req, "audit:read", async (_wallet, request) => {
    const params = request.nextUrl.searchParams;
    const actor = params.get("actor") ?? undefined;
    const action = params.get("action") ?? undefined;
    const entity = params.get("resource") ?? undefined;
    const correlationId = params.get("correlationId") ?? undefined;
    const limit = Number(params.get("limit") ?? 100);

    const logs = await prisma().auditLog.findMany({
      where: {
        ...(actor ? { actor } : {}),
        ...(action ? { action: { contains: action } } : {}),
        ...(entity ? { entity } : {}),
        ...(correlationId ? { correlationId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return jsonResponse({ logs, exportable: true });
  });
