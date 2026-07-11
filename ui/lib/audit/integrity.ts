import { createHash } from "crypto";
import { prisma } from "@/lib/auth/session";

export function computeAuditHash(previousHash: string | null, record: Record<string, unknown>): string {
  const payload = JSON.stringify({
    previousHash: previousHash ?? "GENESIS",
    actor: record.actor ?? null,
    action: record.action,
    entity: record.entity ?? null,
    entityId: record.entityId ?? null,
    eventId: record.eventId ?? null,
    sessionId: record.sessionId ?? null,
    correlationId: record.correlationId ?? null,
    metadata: record.metadata ?? null,
    createdAt: record.createdAt ?? new Date().toISOString(),
  });
  return createHash("sha256").update(payload).digest("hex");
}

export async function getLatestAuditHash(): Promise<string | null> {
  const latest = await prisma().auditIntegrity.findFirst({
    orderBy: { createdAt: "desc" },
    select: { recordHash: true },
  });
  if (latest) return latest.recordHash;

  const legacy = await prisma().auditLog.findFirst({
    where: { recordHash: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { recordHash: true },
  });
  return legacy?.recordHash ?? null;
}

export async function appendAuditIntegrity(auditLogId: string, recordHash: string, previousHash: string | null): Promise<void> {
  await prisma().auditIntegrity.create({
    data: { auditLogId, recordHash, previousHash, verified: true },
  });
}

export async function verifyAuditChain(limit = 500): Promise<{ valid: boolean; brokenAt?: string; checked: number }> {
  const rows = await prisma().auditLog.findMany({
    where: { recordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, recordHash: true, previousHash: true, action: true, actor: true, entity: true, entityId: true, eventId: true, sessionId: true, correlationId: true, metadata: true, createdAt: true },
  });

  let previous: string | null = null;
  for (const row of rows) {
    const expected = computeAuditHash(previous, row as unknown as Record<string, unknown>);
    if (row.recordHash !== expected || row.previousHash !== previous) {
      return { valid: false, brokenAt: row.id, checked: rows.length };
    }
    previous = row.recordHash;
  }
  return { valid: true, checked: rows.length };
}
