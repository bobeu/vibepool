"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const APP_OVERLAY_ROOT_ID = "nexora-overlay-root";

function isDisplayed(el: HTMLElement): boolean {
  let cur: HTMLElement | null = el;
  while (cur) {
    const style = getComputedStyle(cur);
    if (style.display === "none" || style.visibility === "hidden") return false;
    cur = cur.parentElement;
  }
  return true;
}

function resolveOverlayHost(): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`#${APP_OVERLAY_ROOT_ID}`);
  for (const node of nodes) {
    if (isDisplayed(node)) return node;
  }
  return nodes.item(0);
}

/**
 * Renders children into the AppShell overlay layer so modals sit above the
 * bottom nav (which lives in a higher stacking context than `main`).
 * Picks the visible shell host when both mobile and desktop frames are mounted.
 */
export function AppOverlay({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const sync = () => setHost(resolveOverlayHost());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  if (!host) return null;
  return createPortal(children, host);
}
