"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { SectionDivider } from "@/components/hero/SectionDivider";
import { Button } from "@/components/ui/button";
import { container, item } from "@/lib/motion/variants";

const MILESTONES = ["REGISTERED", "FIRST_PREDICTION", "FIRST_TOURNAMENT", "THIRD_ACTIVE_DAY", "FIRST_REWARD"] as const;

export default function ReferralsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => {
      const res = await fetch("/api/referrals");
      if (!res.ok) throw new Error("Failed to load referrals");
      return res.json();
    },
    staleTime: 15_000,
  });

  const { data: invites } = useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const res = await fetch("/api/invites");
      if (!res.ok) throw new Error("Failed to load invites");
      return res.json();
    },
    staleTime: 15_000,
  });

  const generateMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error("Failed to generate invite");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invites"] }),
  });

  const claimMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId }),
      });
      if (!res.ok) throw new Error("Failed to claim");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["referrals"] }),
  });

  const summary = {
    total: data?.total ?? 0,
    successful: data?.successful ?? 0,
    pending: data?.pending ?? 0,
    nextMilestone: data?.nextMilestone ?? null,
  };
  const rewards: any[] = data?.rewards ?? [];
  const inviteList: any[] = invites?.invites ?? [];

  return (
    <AppShell activeNav="friends">
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.section variants={item}>
          <h1 className="text-xl font-black uppercase tracking-tight">Referral Center</h1>
        </motion.section>

        <motion.section variants={item} className="grid grid-cols-3 gap-3">
          <Stat label="Invited" value={summary.total} />
          <Stat label="Successful" value={summary.successful} />
          <Stat label="Pending" value={summary.pending} />
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <SectionDivider label="Milestones" />
          <GlassContainer className="p-4">
            <div className="flex flex-wrap gap-2">
              {MILESTONES.map((m) => {
                const unlocked = rewards.some((r) => r.milestone === m);
                return (
                  <span
                    key={m}
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      unlocked ? "bg-primary/10 border-primary text-primary" : "bg-muted/40 border-border text-muted-foreground"
                    }`}
                  >
                    {m.replace(/_/g, " ").toLowerCase()}
                  </span>
                );
              })}
            </div>
            {summary.nextMilestone && (
              <p className="mt-3 text-xs text-muted-foreground">Next milestone: {summary.nextMilestone.replace(/_/g, " ").toLowerCase()}</p>
            )}
          </GlassContainer>
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <SectionDivider label="Rewards" />
          {rewards.length === 0 ? (
            <GlassContainer><p className="text-sm text-muted-foreground text-center py-6">No referral rewards yet.</p></GlassContainer>
          ) : (
            rewards.map((r) => (
              <GlassContainer key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{r.milestone.replace(/_/g, " ").toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">{r.rewardType} · {r.amount}</p>
                </div>
                {r.claimed ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400">Claimed</span>
                ) : (
                  <Button className="neobrutal-card" onClick={() => claimMutation.mutate(r.id)} disabled={claimMutation.isPending}>
                    Claim
                  </Button>
                )}
              </GlassContainer>
            ))
          )}
        </motion.section>

        <motion.section variants={item} className="space-y-3">
          <SectionDivider label="Invite Friends" />
          <GlassContainer className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button className="neobrutal-card" onClick={() => generateMutation.mutate("INVITE_CODE")}>Generate Code</Button>
              <Button variant="outline" className="neobrutal-card" onClick={() => generateMutation.mutate("DEEP_LINK")}>Deep Link</Button>
              <Button variant="outline" className="neobrutal-card" onClick={() => generateMutation.mutate("QR")}>QR Code</Button>
              <Button variant="outline" className="neobrutal-card" onClick={() => generateMutation.mutate("MINIPAY")}>MiniPay</Button>
            </div>
            {inviteList.length > 0 && (
              <div className="space-y-2">
                {inviteList.map((i) => (
                  <div key={i.id} className="rounded-xl border border-border/40 bg-muted/30 p-3">
                    <p className="text-xs font-mono text-foreground break-all">{i.url}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{i.type} · used {i.uses}×</p>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
