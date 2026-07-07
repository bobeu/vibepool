import { create } from "zustand";
import type { PredictionRoundSummary } from "@/types";

interface PredictionState {
  currentRound: PredictionRoundSummary | null;
  isSubmitting: boolean;
  setCurrentRound: (round: PredictionRoundSummary | null) => void;
  setIsSubmitting: (v: boolean) => void;
  reset: () => void;
}

export const usePredictionStore = create<PredictionState>((set) => ({
  currentRound: null,
  isSubmitting: false,
  setCurrentRound: (currentRound) => set({ currentRound }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () => set({ currentRound: null, isSubmitting: false }),
}));
