import { prisma } from "@/lib/auth/session";
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
    actor?: string
  ): Promise<void> {
    await prisma().auditLog.create({
      data: {
        actor,
        action,
        entity,
        entityId,
        metadata,
      },
    });

    logger.info("Audit logged", { action, entity, entityId });
  }
}
