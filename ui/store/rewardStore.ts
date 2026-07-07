import { create } from "zustand";
import type { RewardSummary } from "@/types";

interface RewardState {
  summary: RewardSummary | null;
  setSummary: (summary: RewardSummary | null) => void;
  reset: () => void;
}

export const useRewardStore = create<RewardState>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
  reset: () => set({ summary: null }),
}));
