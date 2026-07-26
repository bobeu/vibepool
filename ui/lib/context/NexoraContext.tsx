"use client";

import React, { createContext, useContext, useState } from "react";
import { useAccount } from "wagmi";
import { ZERO_ADDRESS } from "@/config/constants";
import type { AppChainData, PredictionChainData, NexoraContextValue } from "@/types";

const NexoraContext = createContext<NexoraContextValue | undefined>(undefined);

const EMPTY_PREDICTION: PredictionChainData = {
  roundId: 0n,
  higherPool: 0n,
  lowerPool: 0n,
  startPrice: 0n,
  endPrice: null,
  isRoundActive: false,
};

/**
 * App wallet context. Prediction tournaments are off-chain (Prisma);
 * on-chain reads for a removed PredictionManager were dropped.
 */
export function NexoraProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [chainData] = useState<AppChainData>({
    owner: ZERO_ADDRESS,
    prediction: EMPTY_PREDICTION,
  });

  const value: NexoraContextValue = {
    isConnected: !!isConnected,
    address,
    chainData,
    isLoading: false,
    refreshChainData: () => {},
  };

  return (
    <NexoraContext.Provider value={value}>{children}</NexoraContext.Provider>
  );
}

export function useNexora() {
  const ctx = useContext(NexoraContext);
  if (!ctx) {
    throw new Error("useNexora must be used within NexoraProvider");
  }
  return ctx;
}

/** @deprecated Use useNexora */
export const useVibepool = useNexora;
