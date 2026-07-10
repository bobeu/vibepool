"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: "orange" | "purple" | "cyan";
}

export function StatCard({ label, value, icon, accent = "orange" }: StatCardProps) {
  const accentColors = {
    orange: "text-accent-orange",
    purple: "text-accent-purple",
    cyan: "text-accent-cyan",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-4">
      <div className="flex items-center gap-2">
        {icon && <span className={accentColors[accent]}>{icon}</span>}
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}
