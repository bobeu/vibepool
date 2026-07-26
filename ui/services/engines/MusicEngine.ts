import { keccak256, stringToBytes } from "viem";
import { prisma } from "@/lib/auth/session";
import { verifySpinPurchase } from "@/lib/blockchain/verifySpinPurchase";
import { isGuestWallet } from "@/lib/auth/guest";
import { isSpinPayAsset, type SpinPayAsset } from "@/lib/spin/economy";
import type { IEngine } from "./interfaces";

export function musicItemId(trackId: string): `0x${string}` {
  return keccak256(stringToBytes(`spin-music:${trackId}`));
}

export class MusicEngine implements IEngine {
  name = "MusicEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async ensureSeedCatalog() {
    const count = await prisma().spinMusicTrack.count();
    if (count > 0) return;
    await prisma().spinMusicTrack.createMany({
      data: [
        {
          title: "Pulse Soft",
          artist: "Nexora",
          url: "/audio/spin/pulse-soft.mp3",
          tier: "FREE",
          priceWei: "0",
          priceAsset: "USDm",
          durationSec: 20,
        },
        {
          title: "Arena Glow",
          artist: "Nexora",
          url: "/audio/spin/arena-glow.mp3",
          tier: "PREMIUM",
          priceWei: "10000000000000000",
          priceAsset: "USDm",
          durationSec: 24,
        },
        {
          title: "Gold Rush Beat",
          artist: "Nexora",
          url: "/audio/spin/gold-rush.mp3",
          tier: "GOLD",
          priceWei: "50000000000000000",
          priceAsset: "USDm",
          durationSec: 28,
        },
      ],
    });
  }

  async listCatalog(userId: string) {
    await this.ensureSeedCatalog();
    const [tracks, owned] = await Promise.all([
      prisma().spinMusicTrack.findMany({
        where: { active: true },
        orderBy: [{ tier: "asc" }, { title: "asc" }],
      }),
      prisma().userMusicInventory.findMany({ where: { userId } }),
    ]);
    const ownedMap = new Map(owned.map((o) => [o.trackId, o]));
    return tracks.map((t) => {
      const inv = ownedMap.get(t.id);
      return {
        id: t.id,
        title: t.title,
        artist: t.artist,
        url: t.url,
        tier: t.tier,
        priceWei: t.priceWei,
        priceAsset: t.priceAsset,
        durationSec: t.durationSec,
        itemId: musicItemId(t.id),
        owned: t.tier === "FREE" || Boolean(inv),
        equipped: Boolean(inv?.equipped),
      };
    });
  }

  async purchase(input: {
    wallet: string;
    userId: string;
    trackId: string;
    txHash?: string;
  }) {
    const track = await prisma().spinMusicTrack.findUnique({ where: { id: input.trackId } });
    if (!track || !track.active) throw new Error("Track not found");

    if (track.tier === "FREE" || track.priceWei === "0" || isGuestWallet(input.wallet)) {
      await prisma().userMusicInventory.upsert({
        where: { userId_trackId: { userId: input.userId, trackId: track.id } },
        create: { userId: input.userId, trackId: track.id, equipped: false },
        update: {},
      });
      return {
        success: true,
        trackId: track.id,
        free: track.tier === "FREE" || track.priceWei === "0",
        mock: isGuestWallet(input.wallet),
      };
    }

    if (!input.txHash) throw new Error("Purchase requires on-chain txHash");
    const asset = isSpinPayAsset(track.priceAsset) ? track.priceAsset : "USDm";
    await verifySpinPurchase({
      txHash: input.txHash,
      expectedFrom: input.wallet,
      expectedItemId: musicItemId(track.id),
      expectedAsset: asset as SpinPayAsset,
      minAmountWei: BigInt(track.priceWei),
    });

    await prisma().userMusicInventory.upsert({
      where: { userId_trackId: { userId: input.userId, trackId: track.id } },
      create: { userId: input.userId, trackId: track.id, equipped: false },
      update: {},
    });

    return { success: true, trackId: track.id, free: false, txHash: input.txHash };
  }

  async equip(userId: string, trackId: string) {
    const track = await prisma().spinMusicTrack.findUnique({ where: { id: trackId } });
    if (!track) throw new Error("Track not found");

    if (track.tier !== "FREE") {
      const owned = await prisma().userMusicInventory.findUnique({
        where: { userId_trackId: { userId, trackId } },
      });
      if (!owned) throw new Error("Track not owned");
    } else {
      await prisma().userMusicInventory.upsert({
        where: { userId_trackId: { userId, trackId } },
        create: { userId, trackId, equipped: true },
        update: {},
      });
    }

    await prisma().$transaction([
      prisma().userMusicInventory.updateMany({
        where: { userId, equipped: true },
        data: { equipped: false },
      }),
      prisma().userMusicInventory.upsert({
        where: { userId_trackId: { userId, trackId } },
        create: { userId, trackId, equipped: true },
        update: { equipped: true },
      }),
    ]);

    return { success: true, equippedTrackId: trackId };
  }

  async getEquipped(userId: string) {
    await this.ensureSeedCatalog();
    const equipped = await prisma().userMusicInventory.findFirst({
      where: { userId, equipped: true },
      include: { track: true },
    });
    if (equipped) return equipped.track;
    return prisma().spinMusicTrack.findFirst({
      where: { active: true, tier: "FREE" },
      orderBy: { createdAt: "asc" },
    });
  }
}

export const musicEngine = new MusicEngine();
