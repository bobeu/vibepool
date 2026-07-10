"use client";

import { motion } from "framer-motion";

interface RewardExplosionProps {
  trigger?: boolean;
  onComplete?: () => void;
}

export function RewardExplosion({ trigger, onComplete }: RewardExplosionProps) {
  if (!trigger) return null;

  const particles = Array.from({ length: 24 });

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 360;
        const distance = 60 + Math.random() * 40;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;

        return (
          <motion.span
            key={i}
            className="absolute block rounded-full bg-primary"
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x, y, scale: 0, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={onComplete}
          />
        );
      })}
    </div>
  );
}
