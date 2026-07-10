import { prisma } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import { eventBus } from "./EventBus";
import type { IMissionEngine } from "./interfaces";

export class MissionEngine implements IMissionEngine {
  name = "MissionEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async generateDailyMissions(userId: string): Promise<Record<string, unknown>[]> {
    const existingMissions = await prisma().userMission.findMany({
      where: {
        userId,
        mission: {
          category: "DAILY",
          status: "ACTIVE",
        },
        completed: false,
      },
      include: { mission: true },
    });

    if (existingMissions.length > 0) {
      return existingMissions.map((m) => this.toResponse(m));
    }

    const templates = await prisma().dailyMission.findMany({
      where: {
        category: "DAILY",
        status: "ACTIVE",
      },
      take: 3,
    });

    const missions: Record<string, unknown>[] = [];

    for (const template of templates) {
      const userMission = await prisma().userMission.create({
        data: {
          userId,
          missionId: template.id,
          category: template.category,
          targetValue: template.targetValue || 1,
        },
        include: { mission: true },
      });

      missions.push(this.toResponse(userMission));

      eventBus.publish({
        event: "MissionAvailable",
        userId,
        missionId: template.id,
        category: template.category,
      });
    }

    return missions;
  }

  async getActiveMissions(userId: string): Promise<Record<string, unknown>[]> {
    const missions = await prisma().userMission.findMany({
      where: {
        userId,
        completed: false,
        mission: {
          status: "ACTIVE",
        },
      },
      include: { mission: true },
      orderBy: { createdAt: "desc" },
    });

    return missions.map((m) => this.toResponse(m));
  }

  async updateProgress(userId: string, missionId: string, increment: number): Promise<Record<string, unknown>> {
    const userMission = await prisma().userMission.findFirst({
      where: { userId, missionId },
      include: { mission: true },
    });

    if (!userMission || userMission.completed) {
      return { id: userMission?.id, progress: userMission?.currentValue || 0 };
    }

    const newValue = Math.min((userMission.currentValue || 0) + increment, userMission.targetValue || 1);
    const completed = newValue >= (userMission.targetValue || 1);

    const updated = await prisma().userMission.update({
      where: { id: userMission.id },
      data: {
        currentValue: newValue,
        completed,
        completedAt: completed ? new Date() : undefined,
        claimable: completed,
      },
    });

    if (completed) {
      eventBus.publish({
        event: "MissionCompleted",
        userId,
        missionId,
        missionTitle: userMission.mission.title,
        xpReward: userMission.mission.xpReward,
        pointReward: userMission.mission.pointReward,
        spinReward: userMission.mission.spinReward,
      });
    }

    return this.toResponse(updated);
  }

  async completeMission(userId: string, missionId: string): Promise<Record<string, unknown>> {
    const userMission = await prisma().userMission.findFirst({
      where: { userId, missionId },
    });

    if (!userMission) {
      throw new Error("Mission not found");
    }

    if (userMission.completed) {
      return this.toResponse(userMission);
    }

    const updated = await prisma().userMission.update({
      where: { id: userMission.id },
      data: {
        currentValue: userMission.targetValue,
        completed: true,
        completedAt: new Date(),
        claimable: true,
      },
    });

    eventBus.publish({
      event: "MissionCompleted",
      userId,
      missionId,
    });

    return this.toResponse(updated);
  }

  async claimMission(userId: string, missionId: string): Promise<Record<string, unknown>> {
    const userMission = await prisma().userMission.findFirst({
      where: { userId, missionId, completed: true, claimed: false },
      include: { mission: true },
    });

    if (!userMission) {
      throw new Error("Mission not claimable");
    }

    const updated = await prisma().userMission.update({
      where: { id: userMission.id },
      data: {
        claimed: true,
        claimedAt: new Date(),
        claimable: false,
      },
    });

    eventBus.publish({
      event: "MissionClaimed",
      userId,
      missionId,
      xpReward: userMission.mission.xpReward,
      pointReward: userMission.mission.pointReward,
    });

    return this.toResponse(updated);
  }

  private toResponse(userMission: Record<string, unknown>): Record<string, unknown> {
    return {
      id: userMission.id,
      userId: userMission.userId,
      missionId: userMission.missionId,
      category: userMission.category,
      currentValue: userMission.currentValue || 0,
      targetValue: userMission.targetValue,
      completed: userMission.completed,
      completedAt: userMission.completedAt,
      claimable: userMission.claimable || false,
      claimed: userMission.claimed || false,
      claimedAt: userMission.claimedAt,
      mission: userMission.mission,
      createdAt: userMission.createdAt,
      updatedAt: userMission.updatedAt,
    };
  }
}
