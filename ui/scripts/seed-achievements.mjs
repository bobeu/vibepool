import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const seeds = [
  {
    slug: "first-spin",
    title: "First Spin",
    description: "Complete your first Spin Hunt session.",
    category: "LIFETIME",
    rarity: "COMMON",
    xpReward: 50,
  },
  {
    slug: "arena-rookie",
    title: "Arena Rookie",
    description: "Play your first arena match.",
    category: "SKILL",
    rarity: "COMMON",
    xpReward: 75,
  },
  {
    slug: "mission-starter",
    title: "Mission Starter",
    description: "Complete a daily mission.",
    category: "DAILY",
    rarity: "COMMON",
    xpReward: 40,
  },
  {
    slug: "season-explorer",
    title: "Season Explorer",
    description: "Earn XP during the active season.",
    category: "SEASONAL",
    rarity: "RARE",
    xpReward: 100,
  },
];

for (const seed of seeds) {
  const existing = await p.achievement.findFirst({ where: { slug: seed.slug } });
  if (existing) {
    await p.achievement.update({
      where: { id: existing.id },
      data: {
        title: seed.title,
        description: seed.description,
        category: seed.category,
        rarity: seed.rarity,
        xpReward: seed.xpReward,
        active: true,
      },
    });
    continue;
  }

  await p.achievement.create({
    data: {
      id: randomUUID(),
      ...seed,
      active: true,
    },
  });
}

const count = await p.achievement.count({ where: { active: true } });
console.log("active achievements", count);
await p.$disconnect();
