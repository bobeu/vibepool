import { prisma } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/api/responses";

function sanitizeDbError(error: unknown) {
  if (!(error instanceof Error)) {
    return { name: "UnknownError", message: "Database check failed" };
  }
  const message = error.message.split("\n")[0]?.slice(0, 180) || "Database check failed";
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;
  // Never echo connection strings / credentials if Prisma includes them.
  const safeMessage = message
    .replace(/postgres(?:ql)?:\/\/[^\s)]+/gi, "postgres://***")
    .replace(/prisma\+postgres:\/\/[^\s)]+/gi, "prisma+postgres://***");
  return { name: error.name, code, message: safeMessage };
}

export const GET = async () => {
  try {
    await prisma().userProfile.count();
    return jsonResponse({ status: "ready", timestamp: new Date().toISOString() });
  } catch (error) {
    return jsonResponse(
      {
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: sanitizeDbError(error),
        dbHostHint: (() => {
          const cs =
            process.env["DATABASE_URL_POOLED"]?.trim() ||
            process.env["DATABASE_URL"]?.trim() ||
            "";
          return (cs.match(/@([^:/]+)/) || [])[1] || "missing";
        })(),
      },
      503,
    );
  }
};
