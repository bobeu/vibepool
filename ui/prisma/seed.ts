import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { key: "xp_per_level" },
    update: {},
    create: { key: "xp_per_level", value: "1000" },
  });

  await prisma.settings.upsert({
    where: { key: "tournament_cadence" },
    update: {},
    create: { key: "tournament_cadence", value: "daily" },
  });

  await prisma.settings.upsert({
    where: { key: "maintenance_mode" },
    update: {},
    create: { key: "maintenance_mode", value: "false" },
  });

  const season = await prisma.season.upsert({
    where: { number: 1 },
    update: {},
    create: {
      number: 1,
      name: "Genesis Season",
      description: "The inaugural NEXORA competitive season.",
      status: "ACTIVE",
      startAt: new Date(),
      endAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.seasonTier.createMany({
    data: [
      { seasonId: season.id, tierLevel: 1, name: "Bronze", xpRequired: 0 },
      { seasonId: season.id, tierLevel: 2, name: "Silver", xpRequired: 500 },
      { seasonId: season.id, tierLevel: 3, name: "Gold", xpRequired: 1500 },
    ],
    skipDuplicates: true,
  });

  const flags = [
    { key: "arena", enabled: true, targetType: "GLOBAL" as const },
    { key: "prediction", enabled: true, targetType: "GLOBAL" as const },
    { key: "spins", enabled: true, targetType: "GLOBAL" as const },
    { key: "referrals", enabled: true, targetType: "GLOBAL" as const },
    { key: "achievements", enabled: true, targetType: "GLOBAL" as const },
    { key: "community", enabled: true, targetType: "GLOBAL" as const },
    { key: "season", enabled: true, targetType: "GLOBAL" as const },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  await prisma.contentBlock.createMany({
    data: [
      {
        type: "HERO_BANNER",
        title: "NEXORA Genesis Season",
        body: "Compete in the arena, earn season XP, and climb the tiers.",
        ctaLabel: "Enter Arena",
        ctaUrl: "/arena",
        placement: "HOME_HERO",
        priority: 10,
        active: true,
        locale: "en",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.banner.createMany({
    data: [
      {
        title: "Weekend Double XP",
        subtitle: "Arena wins grant bonus season XP this weekend.",
        placement: "HOME_HERO",
        priority: 5,
        active: true,
        ctaLabel: "View Events",
        ctaUrl: "/events",
      },
    ],
    skipDuplicates: true,
  });

  const tournament = await prisma.tournament.create({
    data: {
      name: "Sample Tournament",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "LOCKED",
      rewardPool: 1000,
      asset: "0x0000000000000000000000000000000000000000",
      maxPlayers: 100,
      currentPlayers: 0,
      seasonNumber: 1,
      dailyNumber: 1,
    },
  });

  const missions = await prisma.dailyMission.createMany({
    data: [
      {
        title: "Daily Login",
        description: "Log in to Vibepool today",
        xpReward: 50,
        pointReward: 20,
        spinReward: 1,
        missionType: "LOGIN",
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        targetValue: 1,
      },
      {
        title: "Make a Prediction",
        description: "Submit one prediction today",
        xpReward: 100,
        pointReward: 50,
        spinReward: 1,
        missionType: "PREDICTION",
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        targetValue: 2,
      },
    ],
  });

  console.log("Seed completed", { season, tournament, missions });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
