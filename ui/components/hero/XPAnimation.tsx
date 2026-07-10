"use client";

import { motion } from "framer-motion";

interface XPAnimationProps {
  xp: number;
  triggered?: boolean;
}

export function XPAnimation({ xp, triggered }: XPAnimationProps) {
  if (!triggered) return null;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1] }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <span className="text-2xl font-black text-primary drop-shadow-md">+{xp} XP</span>
    </motion.div>
  );
}
