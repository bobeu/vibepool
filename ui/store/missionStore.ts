import { create } from "zustand";
import type { MissionSummary } from "@/types";

interface MissionState {
  missions: MissionSummary[];
  setMissions: (missions: MissionSummary[]) => void;
  reset: () => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  missions: [],
  setMissions: (missions) => set({ missions }),
  reset: () => set({ missions: [] }),
}));
