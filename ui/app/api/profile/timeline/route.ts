import { NextRequest } from "next/server";
import { authenticatedHandler } from "@/lib/auth/middleware";
import { prisma } from "@/lib/auth/session";
import { jsonResponse, apiError } from "@/lib/api/responses";

interface TimelineEntry {
  id: string;
  kind: string;
  title: string;
  body: string;
  referenceId?: string | null;
  createdAt: Date;
}

export const GET = async (req: NextRequest) => {
  return authenticatedHandler(req, async (wallet) => {
    try {
      const profile = await prisma().userProfile.findUnique({
        where: { wallet },
        select: { id: true },
      });
      if (!profile) return jsonResponse({ timeline: [] });

      const userId = profile.id;
      const entries: TimelineEntry[] = [];

      const snapshots = await prisma().progressSnapshot.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      for (const s of snapshots) {
        entries.push({
          id: s.id,
          kind: "SNAPSHOT",
          title: `Progress: ${s.snapshotType}`,
          body: `Level ${s.level} · ${s.xp?.toLocaleString()} XP`,
          createdAt: s.createdAt,
        });
      }

      const feed = await prisma().feedItem.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      for (const f of feed) {
        entries.push({
          id: f.id,
          kind: `FEED_${f.type}`,
          title: f.title,
          body: f.body,
          referenceId: f.referenceId,
          createdAt: f.createdAt,
        });
      }

      const activities = await prisma().activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 25,
      });
      for (const a of activities) {
        entries.push({
          id: a.id,
          kind: `ACTIVITY_${a.type}`,
          title: `Activity: ${a.type}`,
          body: a.metadata ? JSON.stringify(a.metadata) : "",
          createdAt: a.createdAt,
        });
      }

      entries.sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime());
      const timeline = entries.slice(0, 50);

      return jsonResponse({ timeline });
    } catch (error) {
      return apiError(error);
    }
  });
};
