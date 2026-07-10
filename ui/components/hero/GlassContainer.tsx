"use client";

import { motion } from "framer-motion";

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassContainer({ children, className, glow }: GlassContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md
        ${glow ? "shadow-[0_0_20px_hsl(var(--primary)/0.25)]" : ""}
        ${className ?? ""}
      `}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent-orange)/0.1),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--accent-purple)/0.1),transparent_40%)]" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
