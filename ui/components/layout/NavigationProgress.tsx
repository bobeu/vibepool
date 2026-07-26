"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Centered loading indicator while Next.js navigates between pages/subpages.
 * Especially helpful in slow dev compiles where the UI otherwise looks frozen.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!el) return;
      const href = el.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (el.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname && url.search === window.location.search) return;
        setVisible(true);
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nav-progress"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-black bg-zinc-950 px-6 py-5 shadow-[4px_4px_0_#000]">
            <motion.div
              className="h-10 w-10 rounded-full border-[3px] border-cyan-300/30 border-t-cyan-300"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">Loading</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
