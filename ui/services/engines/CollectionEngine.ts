import { keccak256, stringToBytes } from "viem";
import { prisma } from "@/lib/auth/session";
import { verifySpinPurchase } from "@/lib/blockchain/verifySpinPurchase";
import { isGuestWallet } from "@/lib/auth/guest";
import { isSpinPayAsset, type SpinPayAsset } from "@/lib/spin/economy";
import type { IEngine } from "./interfaces";

export function collectionItemId(itemId: string): `0x${string}` {
  return keccak256(stringToBytes(`spin-item:${itemId}`));
}

export type SpinLoadout = {
  rpmMultiplier: number;
  buzzerTapBonus: number;
  musicTrackId: string | null;
  musicUrl: string | null;
  itemSlugs: string[];
};

export class CollectionEngine implements IEngine {
  name = "CollectionEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async ensureSeedCatalog() {
    const count = await prisma().spinCollectionItem.count();
    if (count === 0) {
      await prisma().spinCollectionItem.createMany({
        data: [
          {
            slug: "speed-shielder-1",
            name: "Speed Shielder",
            type: "SPEED_SHIELDER",
            tier: 1,
            priceWei: "20000000000000000",
            priceAsset: "USDm",
            effect: { rpmMultiplier: 0.65 },
          },
          {
            slug: "buzzer-1",
            name: "Quick Buzzer",
            type: "BUZZER",
            tier: 1,
            priceWei: "15000000000000000",
            priceAsset: "USDm",
            effect: { tapBonus: 1 },
          },
          {
            slug: "spin-capacity-5",
            name: "Spin Capacity +5",
            type: "OTHER",
            tier: 1,
            priceWei: "10000000000000000",
            priceAsset: "USDm",
            effect: { grantSpins: 5 },
          },
        ],
      });
      return;
    }

    // Backfill capacity pack for DBs that seeded before this item existed.
    await prisma().spinCollectionItem.upsert({
      where: { slug: "spin-capacity-5" },
      create: {
        slug: "spin-capacity-5",
        name: "Spin Capacity +5",
        type: "OTHER",
        tier: 1,
        priceWei: "10000000000000000",
        priceAsset: "USDm",
        effect: { grantSpins: 5 },
      },
      update: { active: true, effect: { grantSpins: 5 } },
    });
  }

  async listCatalog(userId: string) {
    await this.ensureSeedCatalog();
    const [items, owned] = await Promise.all([
      prisma().spinCollectionItem.findMany({
        where: { active: true },
        orderBy: [{ type: "asc" }, { tier: "asc" }],
      }),
      prisma().userInventoryItem.findMany({ where: { userId } }),
    ]);
    const ownedMap = new Map(owned.map((o) => [o.itemId, o]));
    return items.map((item) => {
      const inv = ownedMap.get(item.id);
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        type: item.type,
        tier: item.tier,
        priceWei: item.priceWei,
        priceAsset: item.priceAsset,
        effect: item.effect,
        itemId: collectionItemId(item.id),
        owned: Boolean(inv),
        equipped: Boolean(inv?.equipped),
      };
    });
  }

  async purchase(input: {
    wallet: string;
    userId: string;
    itemDbId: string;
    txHash?: string;
  }) {
    const item = await prisma().spinCollectionItem.findUnique({ where: { id: input.itemDbId } });
    if (!item || !item.active) throw new Error("Item not found");
    if (item.priceWei === "0" || isGuestWallet(input.wallet)) {
      await prisma().userInventoryItem.upsert({
        where: { userId_itemId: { userId: input.userId, itemId: item.id } },
        create: { userId: input.userId, itemId: item.id, equipped: false },
        update: {},
      });

      const effect = (item.effect ?? {}) as { grantSpins?: number };
      let grantedSpins = 0;
      if (isGuestWallet(input.wallet) && typeof effect.grantSpins === "number" && effect.grantSpins > 0) {
        const { SpinEngine } = await import("./SpinEngine");
        const spins = new SpinEngine();
        for (let i = 0; i < effect.grantSpins; i++) {
          await spins.grantSpin(input.userId, "EVENT", `FREEPLAY_ITEM_${item.slug}`);
        }
        grantedSpins = effect.grantSpins;
      }

      return {
        success: true,
        itemId: item.id,
        free: item.priceWei === "0",
        mock: isGuestWallet(input.wallet),
        grantedSpins,
      };
    }

    if (!input.txHash) throw new Error("Purchase requires on-chain txHash");

    const asset = isSpinPayAsset(item.priceAsset) ? item.priceAsset : "USDm";
    await verifySpinPurchase({
      txHash: input.txHash,
      expectedFrom: input.wallet,
      expectedItemId: collectionItemId(item.id),
      expectedAsset: asset as SpinPayAsset,
      minAmountWei: BigInt(item.priceWei),
    });

    await prisma().userInventoryItem.upsert({
      where: { userId_itemId: { userId: input.userId, itemId: item.id } },
      create: { userId: input.userId, itemId: item.id, equipped: false },
      update: {},
    });

    return { success: true, itemId: item.id, free: false, txHash: input.txHash };
  }

  async equip(userId: string, itemDbId: string, equipped = true) {
    const owned = await prisma().userInventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId: itemDbId } },
      include: { item: true },
    });
    if (!owned) throw new Error("Item not owned");

    // One equipped item per type
    if (equipped) {
      const sameType = await prisma().userInventoryItem.findMany({
        where: { userId, equipped: true, item: { type: owned.item.type } },
        include: { item: true },
      });
      await prisma().$transaction([
        ...sameType.map((row) =>
          prisma().userInventoryItem.update({
            where: { id: row.id },
            data: { equipped: false },
          })
        ),
        prisma().userInventoryItem.update({
          where: { id: owned.id },
          data: { equipped: true },
        }),
      ]);
    } else {
      await prisma().userInventoryItem.update({
        where: { id: owned.id },
        data: { equipped: false },
      });
    }

    return { success: true, itemId: itemDbId, equipped };
  }

  async resolveLoadout(userId: string): Promise<SpinLoadout> {
    await this.ensureSeedCatalog();
    const equipped = await prisma().userInventoryItem.findMany({
      where: { userId, equipped: true },
      include: { item: true },
    });

    let rpmMultiplier = 1;
    let buzzerTapBonus = 0;
    const itemSlugs: string[] = [];

    for (const row of equipped) {
      itemSlugs.push(row.item.slug);
      const effect = (row.item.effect ?? {}) as { rpmMultiplier?: number; tapBonus?: number };
      if (row.item.type === "SPEED_SHIELDER" && typeof effect.rpmMultiplier === "number") {
        rpmMultiplier = Math.min(rpmMultiplier, effect.rpmMultiplier);
      }
      if (row.item.type === "BUZZER" && typeof effect.tapBonus === "number") {
        buzzerTapBonus += effect.tapBonus;
      }
    }

    const { musicEngine } = await import("./MusicEngine");
    const track = await musicEngine.getEquipped(userId);

    return {
      rpmMultiplier: Math.max(0.35, Math.min(1, rpmMultiplier)),
      buzzerTapBonus,
      musicTrackId: track?.id ?? null,
      musicUrl: track?.url ?? null,
      itemSlugs,
    };
  }
}

export const collectionEngine = new CollectionEngine();
