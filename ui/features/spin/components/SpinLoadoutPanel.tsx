"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { Music2, Shield, Zap } from "lucide-react";
import { authFetch } from "@/lib/auth/client";
import { useSpinEconomyPayment } from "@/hooks/useSpinEconomyPayment";
import { isSpinPayAsset } from "@/lib/spin/economy";
import { assetDecimals } from "@/lib/tokens/celoAssets";
import { cn } from "@/utils/format";

type Tab = "music" | "collections";

function priceLabel(priceWei: string, asset: string) {
  if (priceWei === "0") return "Free";
  if (!isSpinPayAsset(asset)) return `${priceWei} ${asset}`;
  try {
    return `${formatUnits(BigInt(priceWei), assetDecimals(asset))} ${asset}`;
  } catch {
    return `${priceWei} ${asset}`;
  }
}

export function SpinLoadoutPanel() {
  const [tab, setTab] = useState<Tab>("music");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { purchaseItem, busy, preferredAsset, isConnected } = useSpinEconomyPayment();

  const musicQuery = useQuery({
    queryKey: ["spin-music"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/music");
      if (!res.ok) throw new Error("Failed to load music");
      return res.json();
    },
    enabled: open,
  });

  const collectionsQuery = useQuery({
    queryKey: ["spin-collections"],
    queryFn: async () => {
      const res = await authFetch("/api/spin/collections");
      if (!res.ok) throw new Error("Failed to load collections");
      return res.json();
    },
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["spin-music"] });
    queryClient.invalidateQueries({ queryKey: ["spin-collections"] });
  };

  const equipMusic = useMutation({
    mutationFn: async (trackId: string) => {
      const res = await authFetch("/api/spin/music", {
        method: "POST",
        body: JSON.stringify({ action: "equip", trackId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Equip failed");
      return body;
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const buyMusic = useMutation({
    mutationFn: async (track: {
      id: string;
      priceWei: string;
      priceAsset: string;
      itemId: `0x${string}`;
      owned: boolean;
      tier: string;
    }) => {
      setError(null);
      if (track.owned || track.tier === "FREE" || track.priceWei === "0") {
        const res = await authFetch("/api/spin/music", {
          method: "POST",
          body: JSON.stringify({ action: "purchase", trackId: track.id }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Claim failed");
        return body;
      }
      if (!isConnected) throw new Error("Connect wallet to buy");
      const asset = isSpinPayAsset(track.priceAsset) ? track.priceAsset : preferredAsset;
      const paid = await purchaseItem({
        itemId: track.itemId,
        asset,
        amountWei: BigInt(track.priceWei),
      });
      const res = await authFetch("/api/spin/music", {
        method: "POST",
        body: JSON.stringify({ action: "purchase", trackId: track.id, txHash: paid.hash }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Purchase verify failed");
      return body;
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const equipItem = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await authFetch("/api/spin/collections", {
        method: "POST",
        body: JSON.stringify({ action: "equip", itemId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Equip failed");
      return body;
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const buyItem = useMutation({
    mutationFn: async (item: {
      id: string;
      priceWei: string;
      priceAsset: string;
      itemId: `0x${string}`;
      owned: boolean;
    }) => {
      setError(null);
      if (item.owned || item.priceWei === "0") {
        const res = await authFetch("/api/spin/collections", {
          method: "POST",
          body: JSON.stringify({ action: "purchase", itemId: item.id, free: true }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Claim failed");
        return body;
      }
      if (!isConnected) throw new Error("Connect wallet to buy");
      const asset = isSpinPayAsset(item.priceAsset) ? item.priceAsset : preferredAsset;
      const paid = await purchaseItem({
        itemId: item.itemId,
        asset,
        amountWei: BigInt(item.priceWei),
      });
      const res = await authFetch("/api/spin/collections", {
        method: "POST",
        body: JSON.stringify({ action: "purchase", itemId: item.id, txHash: paid.hash }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Purchase verify failed");
      return body;
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border-2 border-white/10 bg-zinc-900/80 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
          <Music2 className="h-3.5 w-3.5 text-primary" />
          Music & Collections
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-zinc-900/90 p-2.5">
          <div className="mb-2 grid grid-cols-2 gap-1">
            {(["music", "collections"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-lg py-1.5 text-[10px] font-black uppercase",
                  tab === t ? "bg-primary text-black" : "bg-white/5 text-white/60"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {error && <p className="mb-2 text-[10px] font-bold text-red-400">{error}</p>}

          {tab === "music" && (
            <div className="space-y-1.5">
              {(musicQuery.data?.tracks ?? []).map(
                (track: {
                  id: string;
                  title: string;
                  tier: string;
                  priceWei: string;
                  priceAsset: string;
                  itemId: `0x${string}`;
                  owned: boolean;
                  equipped: boolean;
                }) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                  >
                    <div>
                      <p className="text-[11px] font-black">{track.title}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {track.tier} · {priceLabel(track.priceWei, track.priceAsset)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!track.owned ? (
                        <button
                          type="button"
                          disabled={busy || buyMusic.isPending}
                          onClick={() => buyMusic.mutate(track)}
                          className="rounded-md bg-primary px-2 py-1 text-[9px] font-black uppercase text-black"
                        >
                          Buy
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={track.equipped || equipMusic.isPending}
                          onClick={() => equipMusic.mutate(track.id)}
                          className={cn(
                            "rounded-md px-2 py-1 text-[9px] font-black uppercase",
                            track.equipped ? "bg-white/10 text-white/50" : "bg-white/15 text-white"
                          )}
                        >
                          {track.equipped ? "On" : "Equip"}
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {tab === "collections" && (
            <div className="space-y-1.5">
              {(collectionsQuery.data?.items ?? []).map(
                (item: {
                  id: string;
                  name: string;
                  type: string;
                  priceWei: string;
                  priceAsset: string;
                  itemId: `0x${string}`;
                  owned: boolean;
                  equipped: boolean;
                }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {item.type === "SPEED_SHIELDER" ? (
                        <Shield className="h-3.5 w-3.5 text-amber-300" />
                      ) : (
                        <Zap className="h-3.5 w-3.5 text-primary" />
                      )}
                      <div>
                        <p className="text-[11px] font-black">{item.name}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {item.type.replace("_", " ")} · {priceLabel(item.priceWei, item.priceAsset)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!item.owned ? (
                        <button
                          type="button"
                          disabled={busy || buyItem.isPending}
                          onClick={() => buyItem.mutate(item)}
                          className="rounded-md bg-primary px-2 py-1 text-[9px] font-black uppercase text-black"
                        >
                          Buy
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={item.equipped || equipItem.isPending}
                          onClick={() => equipItem.mutate(item.id)}
                          className={cn(
                            "rounded-md px-2 py-1 text-[9px] font-black uppercase",
                            item.equipped ? "bg-white/10 text-white/50" : "bg-white/15 text-white"
                          )}
                        >
                          {item.equipped ? "On" : "Equip"}
                        </button>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
