import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { getAdminRole } from "@/lib/admin/auth";
import { jsonResponse, apiError } from "@/lib/api/responses";

export const GET = (req: NextRequest) =>
  authenticatedHandler(req, async (wallet) => {
    try {
      const role = await getAdminRole(wallet);
      if (!role) return jsonResponse({ authorized: false }, 403);
      return jsonResponse({ authorized: true, role, wallet });
    } catch (error) {
      return apiError(error);
    }
  });
