"use client";

interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  accent?: "orange" | "purple" | "cyan";
}

export function GlowBorder({ children, className, accent = "orange" }: GlowBorderProps) {
  const accentMap = {
    orange: "shadow-[0_0_15px_hsl(var(--accent-orange)/0.35)]",
    purple: "shadow-[0_0_15px_hsl(var(--accent-purple)/0.35)]",
    cyan: "shadow-[0_0_15px_hsl(var(--accent-cyan)/0.35)]",
  };

  return (
    <div className={`relative rounded-2xl ${accentMap[accent]} ${className ?? ""}`}>
      <div className="relative rounded-2xl border border-border/60 bg-card/80">{children}</div>
    </div>
  );
}
