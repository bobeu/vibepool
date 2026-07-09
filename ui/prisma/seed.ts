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

  const tournament = await prisma.tournament.create({
    data: {
      name: "Sample Tournament",
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "ACTIVE",
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
      },
    ],
  });

  console.log("Seed completed", { tournament, missions });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
