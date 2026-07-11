import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { orderAnimations, shouldInterrupt } from "@/lib/animations/priority";
import { getAnimationDefinition } from "@/lib/animations/registry";

export class UnlockAnimationEngine {
  name = "UnlockAnimationEngine";

  private meta(type: string, rarity?: string): { priority: string; interrupt: boolean } {
    const def = getAnimationDefinition(type, rarity);
    return { priority: def.priority, interrupt: def.interrupt };
  }

  async enqueue(
    userId: string,
    type: string,
    referenceId?: string,
    payload?: Record<string, unknown>,
    rarity?: string
  ): Promise<Record<string, unknown>> {
    const { priority, interrupt } = this.meta(type, rarity);

    const pending = await prisma().unlockAnimation.findMany({
      where: { userId, viewed: false },
      orderBy: { createdAt: "asc" },
    });

    const ordered = orderAnimations(pending as Record<string, unknown>[]);
    const current = ordered[0] ?? null;
    const position = shouldInterrupt({ priority, interrupt }, current) ? 0 : pending.length;

    const animation = await prisma().unlockAnimation.create({
      data: {
        userId,
        type,
        referenceId: referenceId ?? null,
        payload: payload ?? undefined,
        priority,
        interrupt,
        position,
      },
    });

    logger.info("Unlock animation queued", { userId, type, priority, position });
    return {
      id: animation.id,
      type: animation.type,
      priority: animation.priority,
      interrupt: animation.interrupt,
      position: animation.position,
    };
  }

  async getPending(userId: string): Promise<Record<string, unknown>[]> {
    const animations = await prisma().unlockAnimation.findMany({
      where: { userId, viewed: false },
      orderBy: { createdAt: "asc" },
    });

    return orderAnimations(animations as Record<string, unknown>[]).map((a) => ({
      id: a.id,
      type: a.type,
      referenceId: a.referenceId,
      payload: a.payload,
      priority: a.priority,
      interrupt: a.interrupt,
      createdAt: a.createdAt,
    }));
  }

  async markViewed(userId: string, animationId: string): Promise<void> {
    await prisma().unlockAnimation.updateMany({
      where: { id: animationId, userId },
      data: { viewed: true },
    });
  }
}
