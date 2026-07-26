import { NextRequest } from "next/server";
import { adminHandler, jsonResponse } from "@/lib/admin/apiHandler";
import { auditAdminAction } from "@/lib/admin/auth";
import { prisma } from "@/lib/auth/session";
import { spinHuntEngine } from "@/services/engines/SpinHuntEngine";

export const GET = async (req: NextRequest) =>
  adminHandler(req, "content:read", async () => {
    const [config, tracks, items, pending] = await Promise.all([
      spinHuntEngine.getOrCreateConfig(),
      prisma().spinMusicTrack.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma().spinCollectionItem.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma().spinRewardPending.findMany({
        where: { status: "PENDING_SYNC" },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
    ]);
    return jsonResponse({ config, tracks, items, pendingSync: pending });
  });

export const POST = async (req: NextRequest) =>
  adminHandler(req, "content:write", async (wallet, request) => {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "upsertConfig") {
      const cfg = await prisma().spinConfig.upsert({
        where: { key: "default" },
        create: {
          key: "default",
          treasuryBps: Number(body.treasuryBps ?? 7000),
          entryFeeWei: String(body.entryFeeWei ?? "10000000000000000"),
          entryAsset: String(body.entryAsset ?? "USDm"),
          xpCostPerSpin: Number(body.xpCostPerSpin ?? 0),
          spinDurationSec: Number(body.spinDurationSec ?? 10),
          maxBubbleCashWei: String(body.maxBubbleCashWei ?? "1000000000000000"),
          maxCashPerSpinWei: String(body.maxCashPerSpinWei ?? "50000000000000000"),
          baseWheelRpm: Number(body.baseWheelRpm ?? 120),
        },
        update: {
          ...(body.treasuryBps != null ? { treasuryBps: Number(body.treasuryBps) } : {}),
          ...(body.entryFeeWei != null ? { entryFeeWei: String(body.entryFeeWei) } : {}),
          ...(body.entryAsset != null ? { entryAsset: String(body.entryAsset) } : {}),
          ...(body.xpCostPerSpin != null ? { xpCostPerSpin: Number(body.xpCostPerSpin) } : {}),
          ...(body.spinDurationSec != null ? { spinDurationSec: Number(body.spinDurationSec) } : {}),
          ...(body.maxBubbleCashWei != null ? { maxBubbleCashWei: String(body.maxBubbleCashWei) } : {}),
          ...(body.maxCashPerSpinWei != null ? { maxCashPerSpinWei: String(body.maxCashPerSpinWei) } : {}),
          ...(body.baseWheelRpm != null ? { baseWheelRpm: Number(body.baseWheelRpm) } : {}),
        },
      });
      await auditAdminAction(wallet, "upsert_spin_config", "spin", cfg.id);
      return jsonResponse({ config: cfg });
    }

    if (action === "upsertTrack") {
      const id = body.id ? String(body.id) : undefined;
      const data = {
        title: String(body.title ?? "Untitled"),
        artist: body.artist != null ? String(body.artist) : null,
        url: String(body.url ?? ""),
        tier: (body.tier ?? "FREE") as "FREE" | "PREMIUM" | "GOLD",
        priceWei: String(body.priceWei ?? "0"),
        priceAsset: String(body.priceAsset ?? "USDm"),
        durationSec: Number(body.durationSec ?? 15),
        active: body.active !== false,
      };
      const track = id
        ? await prisma().spinMusicTrack.update({ where: { id }, data })
        : await prisma().spinMusicTrack.create({ data });
      await auditAdminAction(wallet, "upsert_spin_track", "spin", track.id);
      return jsonResponse({ track });
    }

    if (action === "upsertItem") {
      const id = body.id ? String(body.id) : undefined;
      const data = {
        slug: String(body.slug ?? `item-${Date.now()}`),
        name: String(body.name ?? "Item"),
        type: (body.type ?? "OTHER") as
          | "SPEED_SHIELDER"
          | "BUZZER"
          | "MUSIC"
          | "OTHER",
        tier: Number(body.tier ?? 1),
        priceWei: String(body.priceWei ?? "0"),
        priceAsset: String(body.priceAsset ?? "USDm"),
        effect: (body.effect ?? {}) as object,
        active: body.active !== false,
      };
      const item = id
        ? await prisma().spinCollectionItem.update({ where: { id }, data })
        : await prisma().spinCollectionItem.create({ data });
      await auditAdminAction(wallet, "upsert_spin_item", "spin", item.id);
      return jsonResponse({ item });
    }

    throw new Error("Invalid admin spin action");
  });
