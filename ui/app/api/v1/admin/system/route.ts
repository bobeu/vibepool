import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { ObservabilityEngine } from "@/services/engines/ObservabilityEngine";
import { AuditEngine } from "@/services/engines/AuditEngine";
import { getSessionIntelligence } from "@/lib/admin/sessionIntelligence";
import { listPolicies } from "@/lib/admin/policy";

const observability = new ObservabilityEngine();
const audit = new AuditEngine();

export const GET = (req: NextRequest) =>
  adminHandler(req, "analytics:read", async (wallet) => {
    await observability.seedDependencies();
    const [dashboard, auditChain, sessionIntel, policies] = await Promise.all([
      observability.getDashboard(),
      audit.verifyChain(200),
      getSessionIntelligence(wallet),
      listPolicies(),
    ]);
    return jsonResponse({ dashboard, auditChain, sessionIntel, policies, degraded: dashboard.health?.status === "DEGRADED" });
  });
