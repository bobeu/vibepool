import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { requireAdmin, auditAdminAction } from "@/lib/admin/auth";
import { jsonResponse, apiError } from "@/lib/api/responses";

export async function adminHandler(
  req: NextRequest,
  permission: string,
  handler: (wallet: string, req: NextRequest) => Promise<Response>,
  audit?: { action: string; resource: string }
): Promise<Response> {
  return authenticatedHandler(req, async (wallet, request) => {
    try {
      await requireAdmin(wallet, permission, request);
      const response = await handler(wallet, request);
      if (audit) {
        await auditAdminAction(wallet, audit.action, audit.resource);
      }
      return response;
    } catch (error) {
      return apiError(error);
    }
  });
}

export { jsonResponse, apiError };
