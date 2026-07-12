"use client";

interface LevelProgressProps {
  xp: number;
  level: number;
  xpPerLevel?: number;
}

export function LevelProgress({ xp, level, xpPerLevel = 1000 }: LevelProgressProps) {
  const nextLevelXp = (level + 1) * xpPerLevel;
  const progress = Math.min((xp / nextLevelXp) * 100, 100);

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex items-baseline justify-between text-[10px] font-black uppercase">
        <span className="text-muted-foreground">XP</span>
        <span>
          {xp.toLocaleString()} / {nextLevelXp.toLocaleString()}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden border-[2px] border-black bg-white">
        <div
          className="h-full bg-gradient-to-r from-secondary via-primary to-accent-green transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
