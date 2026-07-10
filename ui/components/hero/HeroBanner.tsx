"use client";

import { motion } from "framer-motion";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  cta?: string;
  onCta?: () => void;
  imageSrc?: string;
  className?: string;
}

export function HeroBanner({ title, subtitle, cta, onCta, imageSrc, className }: HeroBannerProps) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 ${className ?? ""}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent-orange)/0.15),transparent_40%),radial-gradient(circle_at_80%_80%,hsl(var(--accent-purple)/0.15),transparent_40%)]" />
      <div className="relative flex flex-col gap-4 p-6 sm:p-8">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black leading-tight"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm text-muted-foreground max-w-md"
          >
            {subtitle}
          </motion.p>
        )}
        {cta && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            type="button"
            onClick={onCta}
            className="self-start px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent-purple text-white font-bold text-sm uppercase tracking-wide transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
          >
            {cta}
          </motion.button>
        )}
      </div>
    </section>
  );
}
