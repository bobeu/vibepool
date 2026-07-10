"use client";

interface LevelProgressProps {
  xp: number;
  level: number;
  xpPerLevel?: number;
}

export function LevelProgress({ xp, level, xpPerLevel = 1000 }: LevelProgressProps) {
  const currentLevelXp = level * xpPerLevel;
  const nextLevelXp = (level + 1) * xpPerLevel;
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Level {level}
        </span>
        <span className="text-xs text-muted-foreground">
          {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent-purple transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
