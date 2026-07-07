import { create } from "zustand";
import type { SpinState } from "@/types";

interface SpinStoreState extends SpinState {
  isSpinning: boolean;
  setSpinState: (partial: Partial<SpinState>) => void;
  setIsSpinning: (v: boolean) => void;
  reset: () => void;
}

const initial: SpinState = {
  availableSpins: 0,
  lastSpinAt: null,
};

export const useSpinStore = create<SpinStoreState>((set) => ({
  ...initial,
  isSpinning: false,
  setSpinState: (partial) => set((s) => ({ ...s, ...partial })),
  setIsSpinning: (isSpinning) => set({ isSpinning }),
  reset: () => set({ ...initial, isSpinning: false }),
}));
