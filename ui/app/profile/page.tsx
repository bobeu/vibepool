"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { AppShell } from "@/components/layout/AppShell";
import { LevelProgress } from "@/components/ui/LevelProgress";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { authFetch, startFreePlaySession } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useEnsureSession } from "@/hooks/useEnsureSession";
import { container, item } from "@/lib/motion/variants";

const url = (path: string) => {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { session, refreshSession } = useAuth();
  const { address, isConnected } = useAccount();
  const { ready } = useEnsureSession();
  const [startingFreePlay, setStartingFreePlay] = useState(false);
  const [freePlayError, setFreePlayError] = useState<string | null>(null);

  const hasAccess = Boolean(session) || (ready && Boolean(address));

  const handleStartFreePlay = async () => {
    setStartingFreePlay(true);
    setFreePlayError(null);
    try {
      const ok = await startFreePlaySession({ force: true });
      if (!ok) {
        setFreePlayError("Could not start free play. Please try again.");
        return;
      }
      await refreshSession();
    } catch {
      setFreePlayError("Could not start free play. Please try again.");
    } finally {
      setStartingFreePlay(false);
    }
  };

  const { data: profilePayload, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await authFetch("/api/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });
  const profile = profilePayload?.profile ?? profilePayload;

  const { data: identity, isLoading: identityLoading } = useQuery({
    queryKey: ["profile", "identity"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/identity");
      if (!res.ok) throw new Error("Failed to fetch identity");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await authFetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["profile", "timeline"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/timeline");
      if (!res.ok) throw new Error("Failed to fetch timeline");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const { data: titles } = useQuery({
    queryKey: ["profile", "titles"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/title");
      if (!res.ok) throw new Error("Failed to fetch titles");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const { data: badges } = useQuery({
    queryKey: ["profile", "badges"],
    queryFn: async () => {
      const res = await authFetch("/api/profile/badge");
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const { data: social } = useQuery({
    queryKey: ["profile", "social"],
    queryFn: async () => {
      const [friendsRes, referralsRes, feedRes] = await Promise.all([
        authFetch("/api/friends"),
        authFetch("/api/referrals"),
        authFetch("/api/feed"),
      ]);
      const friends = friendsRes.ok ? await friendsRes.json() : { friends: [] };
      const referrals = referralsRes.ok ? await referralsRes.json() : { total: 0, successful: 0 };
      const feed = feedRes.ok ? await feedRes.json() : { feed: [] };
      return {
        friendCount: friends.friends?.length ?? 0,
        referralCount: referrals.total ?? 0,
        referralRewards: referrals.successful ?? 0,
        activity: feed.feed?.slice(0, 3) ?? [],
      };
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const { data: socialSettings } = useQuery({
    queryKey: ["social-settings"],
    queryFn: async () => {
      const res = await authFetch("/api/social/settings");
      if (!res.ok) throw new Error("Failed to fetch social settings");
      return res.json();
    },
    staleTime: 15_000,
    enabled: hasAccess,
    retry: false,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await authFetch("/api/social/settings", {
        method: "POST",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-settings"] }),
  });
  const evaluateMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/achievements", { method: "POST" });
      if (!res.ok) throw new Error("Failed to evaluate achievements");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });

  if (!hasAccess) {
    return (
      <AppShell activeNav="profile">
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <p className="text-muted-foreground text-sm">
            {isConnected
              ? "Confirm the sign-in message in your wallet to load your profile."
              : "Connect your wallet or start free play to view your profile."}
          </p>
          {!isConnected && (
            <>
              <button
                type="button"
                onClick={handleStartFreePlay}
                disabled={startingFreePlay}
                className="rounded-xl border-4 border-black bg-[#FBBF24] px-4 py-2 text-sm font-black uppercase text-black shadow-[3px_3px_0_rgba(0,0,0,1)] disabled:opacity-60"
              >
                {startingFreePlay ? "Starting…" : "Start Free Play"}
              </button>
              {freePlayError && (
                <p className="text-xs font-medium text-destructive">{freePlayError}</p>
              )}
            </>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="profile">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item}>
          <GlassContainer className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent-purple text-xl font-black text-white">
                {profile?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold">{identity?.displayName ?? profile?.username ?? "Player"}</h1>
                <p className="text-xs text-muted-foreground font-mono">
                  {(session?.wallet ?? address)?.slice(0, 6)}...{(session?.wallet ?? address)?.slice(-4)}
                </p>
                {identity?.selectedTitle && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {identity.selectedTitle}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <LevelProgress xp={profile?.xp ?? 0} level={profile?.level ?? 0} />
            </div>
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="grid grid-cols-2 gap-3">
          <StatCard label="Total XP" value={profile?.xp?.toLocaleString() ?? "0"} />
          <StatCard label="Points" value={profile?.points?.toLocaleString() ?? "0"} />
          <StatCard label="Spins" value={profile?.spins?.toString() ?? "0"} />
          <StatCard label="Rank" value={`#${profile?.currentRank ?? "—"}`} />
          <StatCard label="Current Streak" value={`${profile?.currentStreak ?? 0} days`} />
          <StatCard label="Best Streak" value={`${profile?.longestStreak ?? 0} days`} />
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Identity</h2>
          </div>
          <GlassContainer className="p-4 space-y-3">
            {identityLoading && (
              <div className="h-10 animate-pulse rounded-xl bg-muted/50" />
            )}
            {!identityLoading &&
              (titles?.titles?.length ?? 0) === 0 &&
              (badges?.badges?.length ?? 0) === 0 && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  No titles or badges unlocked yet.
                </p>
              )}
            <div className="flex flex-wrap gap-2">
              {titles?.titles?.map((t: any) => (
                <span
                  key={t.slug}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    t.equipped
                      ? "bg-primary/10 border-primary text-primary"
                      : t.unlocked
                        ? "bg-muted/50 border-border text-foreground"
                        : "bg-muted/30 border-border/50 text-muted-foreground"
                  }`}
                >
                  {t.name}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {badges?.badges?.map((b: any) => (
                <span
                  key={b.slug}
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    b.equipped
                      ? "bg-accent-purple/10 border-accent-purple text-accent-purple"
                      : "bg-muted/50 border-border text-foreground"
                  }`}
                >
                  {b.name}
                </span>
              ))}
            </div>
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Achievements</h2>
            <div className="flex items-center gap-2">
              <Link href="/achievements" className="text-xs font-semibold text-primary">View all</Link>
              <button
                type="button"
                onClick={() => evaluateMutation.mutate()}
                disabled={evaluateMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide transition-all hover:bg-primary/20 disabled:opacity-50"
              >
                {evaluateMutation.isPending ? "Evaluating..." : "Evaluate"}
              </button>
            </div>
          </div>
          <GlassContainer className="p-4">
            {achievementsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {achievements?.achievements?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No achievements yet.</p>
                )}
                {achievements?.achievements?.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-3"
                  >
                    <div>
                      <p className="font-bold text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.unlocked ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.unlocked ? "Unlocked" : `${a.progress}/${a.target}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Social</h2>
            <div className="flex flex-wrap gap-2 justify-end">
              <Link href="/missions" className="text-xs font-semibold text-primary">Missions</Link>
              <Link href="/feed" className="text-xs font-semibold text-primary">Feed</Link>
              <Link href="/referrals" className="text-xs font-semibold text-primary">Referrals</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SocialStat label="Friends" value={social?.friendCount ?? 0} href="/friends" />
            <SocialStat label="Referrals" value={social?.referralCount ?? 0} href="/referrals" />
            <SocialStat label="Rewarded" value={social?.referralRewards ?? 0} href="/referrals" />
            <SocialStat label="Followers" value={0} href="/profile" />
          </div>
          <GlassContainer className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Privacy</p>
            <SettingToggle
              label="Show online status"
              checked={socialSettings?.settings?.onlineStatus ?? true}
              onChange={(onlineStatus) => updateSettingsMutation.mutate({ onlineStatus })}
            />
            <SettingToggle
              label="Accept friend requests"
              checked={socialSettings?.settings?.friendRequests ?? true}
              onChange={(friendRequests) => updateSettingsMutation.mutate({ friendRequests })}
            />
          </GlassContainer>
          {social?.activity?.length > 0 && (
            <GlassContainer className="p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Activity</p>
              {social?.activity.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-3">
                  <p className="font-bold text-sm">{a.title}</p>
                  <span className="text-[10px] text-muted-foreground uppercase">{a.type}</span>
                </div>
              ))}
            </GlassContainer>
          )}
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <h2 className="text-lg font-bold uppercase tracking-tight">Progress Timeline</h2>
          <GlassContainer className="p-4">
            {timelineLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {timeline?.timeline?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
                )}
                {timeline?.timeline?.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-3">
                    <div>
                      <p className="font-bold text-sm">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">{entry.body}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] uppercase text-muted-foreground">{entry.kind}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassContainer>
        </motion.section>
      </motion.div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function SocialStat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border/50 bg-card/60 p-4 text-center transition-all hover:border-primary/50"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </Link>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-primary"
      />
    </label>
  );
}
