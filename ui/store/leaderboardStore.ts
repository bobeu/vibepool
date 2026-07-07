import { create } from "zustand";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardState {
  entries: LeaderboardEntry[];
  period: "daily" | "weekly";
  setEntries: (entries: LeaderboardEntry[]) => void;
  setPeriod: (period: "daily" | "weekly") => void;
  reset: () => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries: [],
  period: "daily",
  setEntries: (entries) => set({ entries }),
  setPeriod: (period) => set({ period }),
  reset: () => set({ entries: [], period: "daily" }),
}));
