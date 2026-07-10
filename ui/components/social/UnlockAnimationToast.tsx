"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/useAuth";

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "border-yellow-400/60 bg-gradient-to-br from-yellow-500/20 to-primary/20",
  HIGH: "border-accent-purple/50 bg-accent-purple/10",
  NORMAL: "border-primary/40 bg-primary/10",
  LOW: "border-border/40 bg-muted/40",
};

export function UnlockAnimationToast() {
  const { session } = useAuth();
  const [current, setCurrent] = useState<any | null>(null);

  const { data } = useQuery({
    queryKey: ["animations"],
    queryFn: async () => {
      const res = await fetch("/api/animations");
      if (!res.ok) return { animations: [] };
      return res.json();
    },
    enabled: !!session,
    refetchInterval: 15_000,
  });

  const markViewed = useMutation({
    mutationFn: async (animationId: string) => {
      await fetch("/api/animations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animationId }),
      });
    },
  });

  useEffect(() => {
    const next = data?.animations?.[0];
    if (next && next.id !== current?.id) {
      setCurrent(next);
    }
    if (!next) setCurrent(null);
  }, [data, current?.id]);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => {
      markViewed.mutate(current.id);
      setCurrent(null);
    }, current.priority === "URGENT" ? 5000 : current.priority === "LOW" ? 2000 : 3500);
    return () => clearTimeout(timer);
  }, [current]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className={`fixed top-16 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border p-4 shadow-xl backdrop-blur-md ${PRIORITY_STYLES[current.priority] ?? PRIORITY_STYLES.NORMAL}`}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{current.type}</p>
        <p className="mt-1 text-sm font-bold">{current.payload?.title ?? "Unlock achieved!"}</p>
        {current.priority === "URGENT" && (
          <p className="mt-1 text-xs text-yellow-300">Legendary unlock!</p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
