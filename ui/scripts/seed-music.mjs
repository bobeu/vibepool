import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/index.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
  }),
});

const catalog = [
  { title: "Pulse Soft", artist: "Nexora", url: "/audio/spin/pulse-soft.wav", tier: "FREE", priceWei: "0", priceAsset: "USDm", durationSec: 12 },
  { title: "Arena Glow", artist: "Nexora", url: "/audio/spin/arena-glow.wav", tier: "PREMIUM", priceWei: "10000000000000000", priceAsset: "USDm", durationSec: 12 },
  { title: "Gold Rush Beat", artist: "Nexora", url: "/audio/spin/gold-rush.wav", tier: "GOLD", priceWei: "50000000000000000", priceAsset: "USDm", durationSec: 12 },
  { title: "Night Circuit", artist: "Nexora", url: "/audio/spin/night-circuit.wav", tier: "FREE", priceWei: "0", priceAsset: "USDm", durationSec: 12 },
  { title: "Spin Fever", artist: "Nexora", url: "/audio/spin/spin-fever.wav", tier: "PREMIUM", priceWei: "15000000000000000", priceAsset: "USDm", durationSec: 12 },
];

for (const track of catalog) {
  const existing = await prisma.spinMusicTrack.findFirst({ where: { title: track.title } });
  if (existing) {
    await prisma.spinMusicTrack.update({
      where: { id: existing.id },
      data: { ...track, active: true },
    });
    console.log("updated", track.title);
  } else {
    await prisma.spinMusicTrack.create({ data: { ...track, active: true } });
    console.log("created", track.title);
  }
}

const coll = [
  { slug: "speed-shielder-1", name: "Speed Shielder", type: "SPEED_SHIELDER", tier: 1, priceWei: "2000000000000000", priceAsset: "USDm", effect: { rpmReduction: 2 } },
  { slug: "buzzer-1", name: "Quick Buzzer", type: "BUZZER", tier: 1, priceWei: "2000000000000000", priceAsset: "USDm", effect: { tapBonus: 1 } },
  { slug: "spin-capacity-5", name: "Spin Capacity +5", type: "OTHER", tier: 1, priceWei: "10000000000000000", priceAsset: "USDm", effect: { grantSpins: 5 } },
];

for (const item of coll) {
  await prisma.spinCollectionItem.upsert({
    where: { slug: item.slug },
    create: { ...item, active: true },
    update: { active: true, name: item.name, priceWei: item.priceWei, effect: item.effect },
  });
  console.log("collection", item.slug);
}

console.log("music", await prisma.spinMusicTrack.count({ where: { active: true } }));
console.log("items", await prisma.spinCollectionItem.count({ where: { active: true } }));
await prisma.$disconnect();
