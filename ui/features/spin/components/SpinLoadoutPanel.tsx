"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { Images, Music2, Pause, Play, Shield, Ticket, Zap } from "lucide-react";
import { authFetch, getAccessToken } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useSpinEconomyPayment } from "@/hooks/useSpinEconomyPayment";
import { useUIStore } from "@/store/uiStore";
import { isSpinPayAsset } from "@/lib/spin/economy";
import { assetDecimals } from "@/lib/tokens/celoAssets";
import { canRefillOrBuyDemoSpins, FREEPLAY_SPIN_PACKS } from "@/lib/spin/freePlay";
import { cn } from "@/utils/format";
import { useAccount } from "wagmi";

type Tab = "music" | "collections" | "spins" | "gallery";

type MusicTrack = {
  id: string;
  title: string;
  url?: string;
  tier: string;
  priceWei: string;
  priceAsset: string;
  itemId: `0x${string}`;
  owned: boolean;
  equipped: boolean;
};

type CollectionItem = {
  id: string;
  name: string;
  type: string;
  priceWei: string;
  priceAsset: string;
  itemId: `0x${string}`;
  owned: boolean;
  equipped: boolean;
  quantity?: number;
};

function priceLabel(priceWei: string, asset: string, freePlay: boolean) {
  if (freePlay && priceWei !== "0") {
    if (!isSpinPayAsset(asset)) return `Demo · ${priceWei} ${asset}`;
    try {
      return `Demo · ${formatUnits(BigInt(priceWei), assetDecimals(asset))} ${asset}`;
    } catch {
      return `Demo · ${priceWei}`;
    }
  }
  if (priceWei === "0") return "Free";
  if (!isSpinPayAsset(asset)) return `${priceWei} ${asset}`;
  try {
    return `${formatUnits(BigInt(priceWei), assetDecimals(asset))} ${asset}`;
  } catch {
    return `${priceWei} ${asset}`;
  }
}

export function SpinLoadoutPanel() {
  const [tab, setTab] = useState<Tab>("collections");
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();
  const { isFreePlay } = useAuth();
  const { address, isConnected: wagmiConnected } = useAccount();
  const showToast = useUIStore((s) => s.showToast);
  const { purchaseItem, busy, preferredAsset, isConnected } = useSpinEconomyPayment();
  const hasToken = Boolean(getAccessToken());
  const inFreeMode = Boolean(isFreePlay && !wagmiConnected && !isConnected);
  const canManageSpins = Boolean(address && canRefillOrBuyDemoSpins(address));

  const musicQuery = useQuery({
    queryKey: ["spin-music", hasToken],
    queryFn: async () => {
      const res = await authFetch("/api/spin/music");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load music");
      }
      return res.json();
    },
    enabled: open && hasToken,
    retry: 1,
  });

  const collectionsQuery = useQuery({
    queryKey: ["spin-collections", hasToken],
    queryFn: async () => {
      const res = await authFetch("/api/spin/collections");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load collections");
      }
      return res.json();
    },
    enabled: open && hasToken,
    retry: 1,
  });

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const stopPreview = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlayingTrackId(null);
  };

  const togglePreview = (track: MusicTrack) => {
    if (!track.url) return;
    if (playingTrackId === track.id) {
      stopPreview();
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener("ended", () => setPlayingTrackId(null));
    }
    const audio = audioRef.current;
    audio.pause();
    audio.src = track.url;
    void audio.play().then(
      () => setPlayingTrackId(track.id),
      () => setPlayingTrackId(null)
    );
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["spin-music"] });
    queryClient.invalidateQueries({ queryKey: ["spin-collections"] });
    queryClient.invalidateQueries({ queryKey: ["spin-hunt-config"] });
    queryClient.invalidateQueries({ queryKey: ["spins"] });
    queryClient.invalidateQueries({ queryKey: ["spin-wallet"] });
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
    mutationFn: async (track: MusicTrack) => {
      setError(null);
      if (inFreeMode || track.owned || track.tier === "FREE" || track.priceWei === "0") {
        const res = await authFetch(
          inFreeMode && track.tier !== "FREE" && track.priceWei !== "0"
            ? "/api/spin/freeplay"
            : "/api/spin/music",
          {
            method: "POST",
            body: JSON.stringify(
              inFreeMode && track.tier !== "FREE" && track.priceWei !== "0"
                ? { action: "purchaseMusic", trackId: track.id }
                : { action: "purchase", trackId: track.id }
            ),
          }
        );
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
    onSuccess: (body) => {
      invalidate();
      if (body?.mock) showToast("Demo purchase complete — no funds spent");
    },
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
    mutationFn: async (item: CollectionItem) => {
      setError(null);
      if (inFreeMode || item.owned || item.priceWei === "0") {
        const res = await authFetch(
          inFreeMode && item.priceWei !== "0" ? "/api/spin/freeplay" : "/api/spin/collections",
          {
            method: "POST",
            body: JSON.stringify(
              inFreeMode && item.priceWei !== "0"
                ? { action: "purchaseItem", itemId: item.id }
                : { action: "purchase", itemId: item.id, free: true }
            ),
          }
        );
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
    onSuccess: (body) => {
      invalidate();
      if (body?.grantedSpins) {
        showToast(`+${body.grantedSpins} spins added (demo)`);
      } else if (body?.mock) {
        showToast("Demo purchase complete — no funds spent");
      }
    },
    onError: (e: Error) => setError(e.message),
  });

  const buySpins = useMutation({
    mutationFn: async (packId: string) => {
      const res = await authFetch("/api/spin/freeplay", {
        method: "POST",
        body: JSON.stringify({ action: "buySpins", packId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to add spins");
      return body;
    },
    onSuccess: (body) => {
      invalidate();
      showToast(body.message || "Spins added (demo)");
    },
    onError: (e: Error) => setError(e.message),
  });

  const refillSpins = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/spin/freeplay", {
        method: "POST",
        body: JSON.stringify({ action: "refillSpins" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not refill spins");
      return body;
    },
    onSuccess: (body) => {
      invalidate();
      showToast(body.message || "Spins refilled");
    },
    onError: (e: Error) => setError(e.message),
  });

  const convertXp = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/spin/convert", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "XP conversion failed");
      return body;
    },
    onSuccess: (body) => {
      invalidate();
      showToast(body.message || "1 Spin added from XP!");
    },
    onError: (e: Error) => setError(e.message),
  });

  const removeMusic = useMutation({
    mutationFn: async (trackId: string) => {
      const res = await authFetch("/api/spin/music", {
        method: "POST",
        body: JSON.stringify({ action: "remove", trackId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Remove failed");
      return body;
    },
    onSuccess: () => {
      invalidate();
      showToast("Track removed from gallery");
    },
    onError: (e: Error) => setError(e.message),
  });

  const tracks = (musicQuery.data?.tracks ?? []) as MusicTrack[];
  const items = (collectionsQuery.data?.items ?? []) as CollectionItem[];
  const ownedTracks = tracks.filter((t) => t.owned);
  const ownedItems = items.filter((i) => i.owned);

  const tabs: Tab[] = canManageSpins
    ? ["collections", "spins", "music", "gallery"]
    : ["spins", "collections", "music", "gallery"];

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border-2 border-white/10 bg-zinc-900/80 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
          <Music2 className="h-3.5 w-3.5 text-primary" />
          {isFreePlay ? "Tester shop · mock prices" : "Music & Collections"}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-zinc-900/90 p-2.5">
          {inFreeMode && (
            <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-widest text-[#FBBF24]">
              Free play — buys are simulated, no wallet txs
            </p>
          )}
          {canManageSpins && (
            <p className="mb-2 text-center text-[9px] font-bold uppercase tracking-widest text-primary">
              Authorized tester — unlimited spin refill enabled
            </p>
          )}

          <div
            className={cn(
              "mb-2 grid gap-1",
              tabs.length === 4 ? "grid-cols-4" : tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"
            )}
          >
            {tabs.map((t) => (
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
          {!hasToken && (
            <p className="mb-2 text-center text-[10px] font-bold text-amber-300">
              Starting free-play session…
            </p>
          )}
          {(musicQuery.isLoading || collectionsQuery.isLoading) && (
            <p className="mb-2 text-center text-[10px] font-bold text-muted-foreground">
              Loading shop…
            </p>
          )}
          {(musicQuery.isError || collectionsQuery.isError) && (
            <p className="mb-2 text-center text-[10px] font-bold text-red-400">
              {(musicQuery.error as Error | undefined)?.message ||
                (collectionsQuery.error as Error | undefined)?.message ||
                "Shop failed to load"}
            </p>
          )}

          {tab === "spins" && (
            <div className="space-y-1.5">
              {/* XP to Spin Conversion - always shown */}
              <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-1">Convert XP → Spin</p>
                <p className="text-[9px] text-muted-foreground mb-2">100 XP = 1 Spin Ticket</p>
                <button
                  type="button"
                  disabled={convertXp.isPending}
                  onClick={() => convertXp.mutate()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-2 text-[10px] font-black uppercase text-black"
                >
                  {convertXp.isPending ? "Converting…" : "Convert 100 XP → 1 Spin"}
                </button>
              </div>
              {canManageSpins && (
                <>
                  <button
                    type="button"
                    disabled={refillSpins.isPending}
                    onClick={() => refillSpins.mutate()}
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#FBBF24] py-2 text-[10px] font-black uppercase text-black shadow-[2px_2px_0_rgba(0,0,0,1)]"
                  >
                    {refillSpins.isPending ? "Refilling…" : "Refill spins (unlimited tester)"}
                  </button>
                  {FREEPLAY_SPIN_PACKS.map((pack) => (
                    <div
                      key={pack.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Ticket className="h-3.5 w-3.5 text-primary" />
                        <div>
                          <p className="text-[11px] font-black">{pack.label}</p>
                          <p className="text-[9px] text-muted-foreground">Demo · {pack.mockPrice}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={buySpins.isPending}
                        onClick={() => buySpins.mutate(pack.id)}
                        className="rounded-md bg-primary px-2 py-1 text-[9px] font-black uppercase text-black"
                      >
                        Get
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "music" && (
            <div className="space-y-1.5">
              {!musicQuery.isLoading && tracks.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[10px] font-bold text-muted-foreground">
                  No music tracks loaded yet
                </p>
              )}
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black">{track.title}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {track.tier} · {priceLabel(track.priceWei, track.priceAsset, inFreeMode)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {track.url ? (
                      <button
                        type="button"
                        onClick={() => togglePreview(track)}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white"
                        aria-label={playingTrackId === track.id ? "Pause" : "Play"}
                      >
                        {playingTrackId === track.id ? (
                          <Pause className="h-3 w-3" strokeWidth={2.5} />
                        ) : (
                          <Play className="h-3 w-3" strokeWidth={2.5} />
                        )}
                      </button>
                    ) : null}
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
              ))}
            </div>
          )}

          {tab === "collections" && (
            <div className="space-y-1.5">
              {!collectionsQuery.isLoading && items.length === 0 && (
                <p className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[10px] font-bold text-muted-foreground">
                  No collection items loaded yet
                </p>
              )}
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                >
                  <div className="flex items-center gap-2">
                    {item.type === "SPEED_SHIELDER" ? (
                      <Shield className="h-3.5 w-3.5 text-amber-300" />
                    ) : item.type === "OTHER" ? (
                      <Ticket className="h-3.5 w-3.5 text-[#FBBF24]" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-primary" />
                    )}
                    <div>
                      <p className="text-[11px] font-black">{item.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {item.type.replace("_", " ")} ·{" "}
                        {priceLabel(item.priceWei, item.priceAsset, inFreeMode)}
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
                    ) : item.type === "OTHER" ? (
                      <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-black uppercase text-white/50">
                        Owned
                      </span>
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
              ))}
            </div>
          )}

          {tab === "gallery" && (
            <div className="space-y-3">
              <p className="text-center text-[9px] font-black uppercase tracking-widest text-primary/80">
                Your gallery
              </p>

              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/55">
                  <Music2 className="h-3 w-3" />
                  Music
                </p>
                {ownedTracks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[10px] font-bold text-muted-foreground">
                    No tracks owned yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {ownedTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-black">{track.title}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {track.equipped ? "Equipped" : track.tier}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {track.url ? (
                            <button
                              type="button"
                              onClick={() => togglePreview(track)}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white"
                              aria-label={playingTrackId === track.id ? "Pause" : "Play"}
                            >
                              {playingTrackId === track.id ? (
                                <Pause className="h-3 w-3" strokeWidth={2.5} />
                              ) : (
                                <Play className="h-3 w-3" strokeWidth={2.5} />
                              )}
                            </button>
                          ) : null}
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
                          {track.tier !== "FREE" && (
                            <button
                              type="button"
                              disabled={removeMusic.isPending}
                              onClick={() => removeMusic.mutate(track.id)}
                              className="rounded-md bg-red-500/20 px-2 py-1 text-[9px] font-black uppercase text-red-400"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/55">
                  <Images className="h-3 w-3" />
                  Collections
                </p>
                {ownedItems.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-2 py-3 text-center text-[10px] font-bold text-muted-foreground">
                    No collections owned yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {ownedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-2 py-2"
                      >
                        <div className="flex items-center gap-2">
                          {item.type === "SPEED_SHIELDER" ? (
                            <Shield className="h-3.5 w-3.5 text-amber-300" />
                          ) : item.type === "OTHER" ? (
                            <Ticket className="h-3.5 w-3.5 text-[#FBBF24]" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 text-primary" />
                          )}
                          <div>
                            <p className="text-[11px] font-black">{item.name}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {item.type.replace("_", " ")}
                              {typeof item.quantity === "number" && item.quantity > 1
                                ? ` · x${item.quantity}`
                                : ""}
                              {item.equipped ? " · Equipped" : ""}
                            </p>
                          </div>
                        </div>
                        {item.type === "OTHER" ? (
                          <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-black uppercase text-white/50">
                            Owned
                          </span>
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
