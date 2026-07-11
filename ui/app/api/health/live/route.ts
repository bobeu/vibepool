import { jsonResponse } from "@/lib/api/responses";

export const GET = () => jsonResponse({ status: "alive", timestamp: new Date().toISOString() });
