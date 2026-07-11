"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { GlassContainer } from "@/components/hero/GlassContainer";
import { Button } from "@/components/ui/button";

export default function ArenaReplayPage() {
  const params = useSearchParams();
  const matchId = params.get("id");

  const { data, isLoading, error } = useQuery({
    queryKey: ["arena-replay", matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      const res = await fetch(`/api/arena/replay?id=${matchId}`);
      if (!res.ok) throw new Error("Failed to load replay");
      return res.json();
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Match Replay</h1>
          <Link href="/arena">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading replay...</p>}
        {error && <p className="text-red-400">Failed to load replay</p>}

        {data && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <GlassContainer className="p-6">
              <p className="text-sm text-muted-foreground">Match ID</p>
              <p className="font-mono text-sm">{matchId}</p>
              {data.auditHash && (
                <>
                  <p className="mt-4 text-sm text-muted-foreground">Audit Hash</p>
                  <p className="break-all font-mono text-xs text-cyan-300/80">{data.auditHash}</p>
                </>
              )}
            </GlassContainer>

            <GlassContainer className="p-6">
              <h2 className="mb-4 font-semibold">Timeline</h2>
              <ol className="space-y-3">
                {(data.timeline as Array<Record<string, unknown>>)?.map((event, i) => (
                  <li key={i} className="rounded-lg bg-black/20 px-3 py-2 text-sm">
                    <span className="text-cyan-300">{String(event.event)}</span>
                    {event.prediction != null && <span className="ml-2 text-muted-foreground">→ {String(event.prediction)}</span>}
                    {event.target != null && <span className="ml-2 text-muted-foreground">Target: {String(event.target)}</span>}
                  </li>
                ))}
              </ol>
            </GlassContainer>

            {data.statistics && (
              <GlassContainer className="p-6">
                <h2 className="mb-2 font-semibold">Statistics</h2>
                <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(data.statistics, null, 2)}</pre>
              </GlassContainer>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
