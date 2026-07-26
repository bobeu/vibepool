import { prismaClient as prisma } from "../lib/prisma";

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
      { seasonId: season.id, tierLevel: 1, name: "Bronze", xpRequired: 0, rewardType: "XP", rewardAmount: 0 },
      { seasonId: season.id, tierLevel: 2, name: "Silver", xpRequired: 500, rewardType: "XP", rewardAmount: 100 },
      { seasonId: season.id, tierLevel: 3, name: "Gold", xpRequired: 1500, rewardType: "XP", rewardAmount: 300 },
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
    { key: "free_play", enabled: true, targetType: "GLOBAL" as const },
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
      name: "Daily CELO Prediction",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "OPEN",
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
        description: "Log in to Nexora today",
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

  // Seed spin reward catalog for the Lucky Drop wheel
  const spinRewards = [
    { name: "25 USDT", asset: "USDT", amount: 25, weight: 5, rarity: "RARE" },
    { name: "500 XP", asset: "XP", amount: 500, weight: 25, rarity: "COMMON" },
    { name: "10 USDC", asset: "USDC", amount: 10, weight: 8, rarity: "RARE" },
    { name: "5 USDm", asset: "USDm", amount: 5, weight: 10, rarity: "UNCOMMON" },
    { name: "100 XP", asset: "XP", amount: 100, weight: 40, rarity: "COMMON" },
    { name: "0.5 CELO", asset: "CELO", amount: 1, weight: 12, rarity: "EPIC" },
  ];

  for (const reward of spinRewards) {
    const existing = await prisma.spinReward.findFirst({ where: { name: reward.name } });
    if (!existing) {
      await prisma.spinReward.create({ data: { ...reward, active: true } });
    }
  }

  console.log("Seed completed", { seasonId: season.id, tournamentId: tournament.id, missions });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
