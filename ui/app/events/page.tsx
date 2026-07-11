"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { container, item } from "@/lib/motion/variants";

type LiveEvent = {
  id: string;
  type: string;
  name: string;
  description?: string;
  status: string;
  startAt: string;
  endAt: string;
};

type Campaign = {
  id: string;
  type: string;
  name: string;
  description?: string;
  status: string;
  startAt?: string;
  endAt?: string;
};

export default function EventsPage() {
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to load events");
      return res.json() as Promise<{ events: LiveEvent[] }>;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns-active"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns?status=ACTIVE");
      if (!res.ok) throw new Error("Failed to load campaigns");
      return res.json() as Promise<{ campaigns: Campaign[] }>;
    },
    staleTime: 15_000,
  });

  const events = eventsData?.events ?? [];
  const campaigns = campaignsData?.campaigns ?? [];
  const activeEvents = events.filter((e) => e.status === "ACTIVE");
  const upcomingEvents = events.filter((e) => e.status === "SCHEDULED");

  return (
    <AppShell activeNav="events">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl font-black uppercase tracking-tight">Event Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Live events, campaigns, and limited-time bonuses.</p>
        </motion.div>

        {eventsLoading && <p className="text-sm text-muted-foreground">Loading events...</p>}

        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-tight">Live Now</h2>
            <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold animate-pulse">
              {activeEvents.length} ACTIVE
            </span>
          </div>
          {activeEvents.length === 0 ? (
            <GlassContainer className="p-4 text-sm text-muted-foreground">No live events right now. Check back soon.</GlassContainer>
          ) : (
            activeEvents.map((event) => (
              <GlassContainer key={event.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-primary font-bold">{event.type.replace(/_/g, " ")}</p>
                    <h3 className="font-bold">{event.name}</h3>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">LIVE</span>
                </div>
                {event.endAt && (
                  <p className="text-xs text-muted-foreground">
                    Ends in <CountdownTimer endTime={event.endAt} />
                  </p>
                )}
              </GlassContainer>
            ))
          )}
        </motion.section>

        {upcomingEvents.length > 0 && (
          <motion.section variants={item} className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-tight">Upcoming</h2>
            {upcomingEvents.map((event) => (
              <GlassContainer key={event.id} className="p-4">
                <p className="text-xs uppercase text-muted-foreground">{event.type}</p>
                <h3 className="font-bold">{event.name}</h3>
                {event.startAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Starts in <CountdownTimer endTime={event.startAt} />
                  </p>
                )}
              </GlassContainer>
            ))}
          </motion.section>
        )}

        {campaigns.length > 0 && (
          <motion.section variants={item} className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-tight">Active Campaigns</h2>
            {campaigns.map((campaign) => (
              <GlassContainer key={campaign.id} className="p-4">
                <p className="text-xs uppercase text-accent-purple font-bold">{campaign.type.replace(/_/g, " ")}</p>
                <h3 className="font-bold">{campaign.name}</h3>
                {campaign.description && <p className="text-sm text-muted-foreground">{campaign.description}</p>}
              </GlassContainer>
            ))}
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}
