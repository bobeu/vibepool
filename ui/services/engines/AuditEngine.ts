import { prisma } from "@/lib/auth/session";
import { appendAuditIntegrity, computeAuditHash, getLatestAuditHash } from "@/lib/audit/integrity";
import { logger } from "@/lib/logging";
import type { IAuditEngine } from "./interfaces";

export class AuditEngine implements IAuditEngine {
  name = "AuditEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async log(
    action: string,
    entity?: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
    actor?: string,
    options?: { eventId?: string; sessionId?: string; correlationId?: string }
  ): Promise<void> {
    const previousHash = await getLatestAuditHash();
    const createdAt = new Date();
    const record = {
      actor,
      action,
      entity,
      entityId,
      eventId: options?.eventId,
      sessionId: options?.sessionId,
      correlationId: options?.correlationId,
      metadata,
      createdAt,
    };
    const recordHash = computeAuditHash(previousHash, record);

    const row = await prisma().auditLog.create({
      data: {
        ...record,
        metadata,
        recordHash,
        previousHash,
      },
    });

    await appendAuditIntegrity(row.id, recordHash, previousHash);

    logger.info("Audit logged", { action, entity, entityId, eventId: options?.eventId, correlationId: options?.correlationId, recordHash });
  }

  async verifyChain(limit?: number): Promise<Record<string, unknown>> {
    const { verifyAuditChain } = await import("@/lib/audit/integrity");
    return verifyAuditChain(limit);
  }
}
