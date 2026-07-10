"use client";

import { AppShell } from "@/components/layout/AppShell";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { useTournaments } from "@/features/tournament";

export default function TournamentPage() {
  const { data: tournaments, isLoading, error } = useTournaments();

  if (isLoading) {
    return (
      <AppShell activeNav="tournament">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="tournament">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-destructive text-sm font-medium">Failed to load tournaments</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  const current = tournaments?.find((t) => t.status === "OPEN");
  const upcoming = tournaments?.filter((t) => t.status === "UPCOMING");
  const completed = tournaments?.filter((t) => t.status === "COMPLETED");

  return (
    <AppShell activeNav="tournament">
      <div className="space-y-6">
        {current && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold uppercase tracking-tight">Live Tournament</h2>
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold animate-pulse">
                LIVE
              </span>
            </div>
            <TournamentCard tournament={current} priority />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Closes in <CountdownTimer endTime={current.endTime} />
            </div>
          </section>
        )}

        {upcoming && upcoming.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-tight">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </section>
        )}

        {completed && completed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold uppercase tracking-tight">Recent Results</h2>
            <div className="space-y-3">
              {completed.slice(0, 5).map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          </section>
        )}

        {!current && !upcoming && !completed && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-muted-foreground text-sm">No tournaments available right now.</p>
            <p className="text-muted-foreground/80 text-xs mt-1">Check back soon for the next challenge.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
