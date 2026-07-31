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
  /** Absolute wheel RPM after Speed Shielder stacks. */
  wheelRpm: number;
  speedShielderQty: number;
  quickBuzzerQty: number;
  buzzerTapBonus: number;
  musicTrackId: string | null;
  musicUrl: string | null;
  itemSlugs: string[];
  nextShielderPriceWei: string;
  nextBuzzerPriceWei: string;
};

/** nextPrice = base * (3/2)^ownedCount  (each purchase raises cost by half of previous). */
export function escalatedPriceWei(baseWei: string, ownedCount: number): string {
  let price = BigInt(baseWei || "0");
  for (let i = 0; i < ownedCount; i++) {
    price = (price * 3n) / 2n;
  }
  return price.toString();
}

export class CollectionEngine implements IEngine {
  name = "CollectionEngine";

  async execute(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return input;
  }

  async ensureSeedCatalog() {
    await prisma().spinCollectionItem.upsert({
      where: { slug: "speed-shielder-1" },
      create: {
        slug: "speed-shielder-1",
        name: "Speed Shielder",
        type: "SPEED_SHIELDER",
        tier: 1,
        priceWei: "2000000000000000",
        priceAsset: "USDm",
        effect: { rpmReduction: 2 },
      },
      update: {
        active: true,
        name: "Speed Shielder",
        priceWei: "2000000000000000",
        effect: { rpmReduction: 2 },
      },
    });

    await prisma().spinCollectionItem.upsert({
      where: { slug: "buzzer-1" },
      create: {
        slug: "buzzer-1",
        name: "Quick Buzzer",
        type: "BUZZER",
        tier: 1,
        priceWei: "2000000000000000",
        priceAsset: "USDm",
        effect: { tapBonus: 1 },
      },
      update: {
        active: true,
        name: "Quick Buzzer",
        priceWei: "2000000000000000",
        effect: { tapBonus: 1 },
      },
    });

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

  private async feeConfig() {
    const cfg = await prisma().spinConfig.findUnique({ where: { key: "default" } });
    return {
      shielderBase: cfg?.speedShielderBasePriceWei ?? "2000000000000000",
      buzzerBase: cfg?.quickBuzzerBasePriceWei ?? "2000000000000000",
      rpmPerShielder: cfg?.rpmReductionPerShielder ?? 2,
      minRpm: cfg?.minWheelRpm ?? 40,
      baseRpm: cfg?.baseWheelRpm ?? 100,
    };
  }

  async listCatalog(userId: string) {
    await this.ensureSeedCatalog();
    const fees = await this.feeConfig();
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
      const qty = inv?.quantity ?? 0;
      let priceWei = item.priceWei;
      if (item.type === "SPEED_SHIELDER") {
        priceWei = escalatedPriceWei(fees.shielderBase, qty);
      } else if (item.type === "BUZZER") {
        priceWei = escalatedPriceWei(fees.buzzerBase, qty);
      }
      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        type: item.type,
        tier: item.tier,
        priceWei,
        priceAsset: item.priceAsset,
        effect: item.effect,
        itemId: collectionItemId(item.id),
        owned: qty > 0,
        quantity: qty,
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
    await this.ensureSeedCatalog();
    const item = await prisma().spinCollectionItem.findUnique({ where: { id: input.itemDbId } });
    if (!item || !item.active) throw new Error("Item not found");

    const fees = await this.feeConfig();
    const existing = await prisma().userInventoryItem.findUnique({
      where: { userId_itemId: { userId: input.userId, itemId: item.id } },
    });
    const ownedQty = existing?.quantity ?? 0;

    let requiredWei = BigInt(item.priceWei);
    if (item.type === "SPEED_SHIELDER") {
      requiredWei = BigInt(escalatedPriceWei(fees.shielderBase, ownedQty));
    } else if (item.type === "BUZZER") {
      requiredWei = BigInt(escalatedPriceWei(fees.buzzerBase, ownedQty));
    }

    const freeOrGuest = requiredWei === 0n || isGuestWallet(input.wallet) || item.priceWei === "0";
    const effect = (item.effect ?? {}) as { grantSpins?: number };
    const grantedSpins =
      typeof effect.grantSpins === "number" && effect.grantSpins > 0
        ? effect.grantSpins
        : 0;
    const purchaseReason = input.txHash
      ? `SPIN_PACK_PURCHASE:${input.txHash.toLowerCase()}`
      : `FREEPLAY_ITEM_${item.slug}`;

    if (!freeOrGuest) {
      if (!input.txHash) throw new Error("Purchase requires on-chain txHash");
      const asset = isSpinPayAsset(item.priceAsset) ? item.priceAsset : "USDm";
      await verifySpinPurchase({
        txHash: input.txHash,
        expectedFrom: input.wallet,
        expectedItemId: collectionItemId(item.id),
        expectedAsset: asset as SpinPayAsset,
        minAmountWei: requiredWei,
      });

      // Reject transaction replay before changing inventory or spin balance.
      if (grantedSpins > 0) {
        const used = await prisma().spinLedger.findFirst({
          where: { reason: purchaseReason },
          select: { id: true },
        });
        if (used) throw new Error("This spin purchase transaction was already redeemed");
      }
    }

    const inv = await prisma().userInventoryItem.upsert({
      where: { userId_itemId: { userId: input.userId, itemId: item.id } },
      create: {
        userId: input.userId,
        itemId: item.id,
        quantity: 1,
        equipped: item.type === "SPEED_SHIELDER" || item.type === "BUZZER",
      },
      update: {
        quantity: { increment: 1 },
        equipped: true,
      },
    });

    // One equipped stack per type
    if (item.type === "SPEED_SHIELDER" || item.type === "BUZZER") {
      const sameType = await prisma().userInventoryItem.findMany({
        where: {
          userId: input.userId,
          equipped: true,
          item: { type: item.type },
          NOT: { id: inv.id },
        },
      });
      if (sameType.length) {
        await prisma().userInventoryItem.updateMany({
          where: { id: { in: sameType.map((r) => r.id) } },
          data: { equipped: false },
        });
      }
    }

    if (grantedSpins > 0) {
      await prisma().$transaction(async (tx) => {
        const alreadyRedeemed = await tx.spinLedger.findFirst({
          where: { reason: purchaseReason },
          select: { id: true },
        });
        if (alreadyRedeemed) {
          throw new Error("This spin purchase transaction was already redeemed");
        }
        await tx.userProfile.update({
          where: { id: input.userId },
          data: { spins: { increment: grantedSpins } },
        });
        await tx.spinLedger.create({
          data: {
            userId: input.userId,
            spinType: freeOrGuest ? "EVENT" : "PURCHASE",
            amount: grantedSpins,
            reason: purchaseReason,
          },
        });
      }, { isolationLevel: "Serializable" });
    }

    const fresh = await prisma().userInventoryItem.findUnique({ where: { id: inv.id } });
    const loadout = await this.resolveLoadout(input.userId);
    return {
      success: true,
      itemId: item.id,
      quantity: fresh?.quantity ?? 1,
      free: requiredWei === 0n,
      mock: isGuestWallet(input.wallet),
      grantedSpins,
      loadout,
      paidWei: requiredWei.toString(),
    };
  }

  async equip(userId: string, itemDbId: string, equipped = true) {
    const owned = await prisma().userInventoryItem.findUnique({
      where: { userId_itemId: { userId, itemId: itemDbId } },
      include: { item: true },
    });
    if (!owned || owned.quantity < 1) throw new Error("Item not owned");

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

    return { success: true, itemId: itemDbId, equipped, loadout: await this.resolveLoadout(userId) };
  }

  async resolveLoadout(userId: string): Promise<SpinLoadout> {
    await this.ensureSeedCatalog();
    const fees = await this.feeConfig();
    const owned = await prisma().userInventoryItem.findMany({
      where: { userId, quantity: { gt: 0 } },
      include: { item: true },
    });

    let speedShielderQty = 0;
    let quickBuzzerQty = 0;
    const itemSlugs: string[] = [];

    for (const row of owned) {
      itemSlugs.push(row.item.slug);
      if (row.item.type === "SPEED_SHIELDER") speedShielderQty += row.quantity;
      if (row.item.type === "BUZZER") quickBuzzerQty += row.quantity;
    }

    const wheelRpm = Math.max(
      fees.minRpm,
      fees.baseRpm - speedShielderQty * fees.rpmPerShielder
    );
    const rpmMultiplier = fees.baseRpm > 0 ? wheelRpm / fees.baseRpm : 1;

    const { musicEngine } = await import("./MusicEngine");
    const track = await musicEngine.getEquipped(userId);

    return {
      rpmMultiplier,
      wheelRpm,
      speedShielderQty,
      quickBuzzerQty,
      buzzerTapBonus: quickBuzzerQty,
      musicTrackId: track?.id ?? null,
      musicUrl: track?.url ?? null,
      itemSlugs,
      nextShielderPriceWei: escalatedPriceWei(fees.shielderBase, speedShielderQty),
      nextBuzzerPriceWei: escalatedPriceWei(fees.buzzerBase, quickBuzzerQty),
    };
  }
}

export const collectionEngine = new CollectionEngine();
