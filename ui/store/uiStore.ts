import { create } from "zustand";

interface UIState {
  isNavOpen: boolean;
  toastMessage: string | null;
  setNavOpen: (v: boolean) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNavOpen: false,
  toastMessage: null,
  setNavOpen: (isNavOpen) => set({ isNavOpen }),
  showToast: (toastMessage) => set({ toastMessage }),
  clearToast: () => set({ toastMessage: null }),
}));
