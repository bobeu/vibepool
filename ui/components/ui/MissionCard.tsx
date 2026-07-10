"use client";

interface MissionCardProps {
  title: string;
  description: string;
  progress: number;
  target: number;
  reward?: string;
  accent?: "orange" | "purple";
}

export function MissionCard({ title, description, progress, target, reward, accent = "orange" }: MissionCardProps) {
  const percent = Math.min((progress / target) * 100, 100);

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-bold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
        {reward && (
          <span className="shrink-0 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
            {reward}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {progress}/{target}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              accent === "orange" ? "bg-gradient-to-r from-primary to-accent-orange" : "bg-gradient-to-r from-accent-purple to-accent-cyan"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
