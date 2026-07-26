"use client";

interface LevelProgressProps {
  xp?: number | null;
  level?: number | null;
  xpPerLevel?: number;
}

export function LevelProgress({
  xp: xpProp,
  level: levelProp,
  xpPerLevel = 1000,
}: LevelProgressProps) {
  const xp = Number.isFinite(Number(xpProp)) ? Number(xpProp) : 0;
  const level = Number.isFinite(Number(levelProp)) ? Number(levelProp) : 0;
  const nextLevelXp = Math.max((level + 1) * xpPerLevel, xpPerLevel);
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
