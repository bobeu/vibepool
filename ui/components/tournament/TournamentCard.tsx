import { useState, useEffect } from "react";

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    status: string;
    startTime: Date | string;
    endTime: Date | string;
    rewardPool: number;
    asset: string;
    currentPlayers: number;
    maxPlayers: number;
  };
  priority?: boolean;
}

export function TournamentCard({ tournament, priority = false }: TournamentCardProps) {
  const startTime = new Date(tournament.startTime);
  const endTime = new Date(tournament.endTime);
  const now = new Date();
  const isLive = tournament.status === "OPEN";
  const isUpcoming = tournament.status === "UPCOMING";
  const isCompleted = tournament.status === "COMPLETED";

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md
        transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5
        ${priority ? "ring-1 ring-primary/30" : ""}
      `}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-foreground leading-tight">{tournament.name}</h3>
            <p className="text-xs text-muted-foreground">
              {isLive ? "Ends" : isUpcoming ? "Starts" : "Ended"}{" "}
              {new Date(tournament.startTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            className={`
              shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
              ${isLive ? "bg-green-500/10 text-green-400 animate-pulse" : ""}
              ${isUpcoming ? "bg-blue-500/10 text-blue-400" : ""}
              ${isCompleted ? "bg-muted text-muted-foreground" : ""}
            `}
          >
            {tournament.status}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Prize</span>
            <span className="font-bold text-foreground">{tournament.rewardPool.toLocaleString()}</span>
            <span className="text-muted-foreground">{tournament.asset}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Players</span>
            <span className="font-bold text-foreground">
              {tournament.currentPlayers}/{tournament.maxPlayers}
            </span>
          </div>
        </div>

        {isLive && (
          <div className="pt-2">
            <button
              type="button"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-sm uppercase tracking-wide transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            >
              Join Tournament
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="pt-2">
            <button
              type="button"
              className="w-full py-3 rounded-xl border border-border/50 bg-muted/50 text-muted-foreground font-bold text-sm uppercase tracking-wide transition-all hover:bg-muted"
            >
              View Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
