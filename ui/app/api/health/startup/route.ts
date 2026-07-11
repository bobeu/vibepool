import { jsonResponse } from "@/lib/api/responses";

const startedAt = Date.now();

export const GET = () =>
  jsonResponse({
    status: "started",
    uptimeMs: Date.now() - startedAt,
    version: process.env.APP_VERSION ?? "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
  });
