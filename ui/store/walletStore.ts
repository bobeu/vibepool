import { create } from "zustand";

interface WalletState {
  isAuthenticating: boolean;
  lastAuthAt: number | null;
  setIsAuthenticating: (v: boolean) => void;
  setLastAuthAt: (ts: number | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  isAuthenticating: false,
  lastAuthAt: null,
  setIsAuthenticating: (isAuthenticating) => set({ isAuthenticating }),
  setLastAuthAt: (lastAuthAt) => set({ lastAuthAt }),
  reset: () => set({ isAuthenticating: false, lastAuthAt: null }),
}));
