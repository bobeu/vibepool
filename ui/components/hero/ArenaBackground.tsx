"use client";

import { motion } from "framer-motion";

interface ArenaBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function ArenaBackground({ children, className }: ArenaBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: "url('/assets/backgrounds/dark-arena.webp')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      <div className="relative">{children}</div>
    </div>
  );
}
