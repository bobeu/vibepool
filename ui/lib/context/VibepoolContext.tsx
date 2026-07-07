"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAccount, useConfig, useReadContracts } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { ZERO_ADDRESS, STALE_TIME_MS } from "@/config/constants";
import type { Address, AppChainData, PredictionChainData, VibepoolContextValue } from "@/types";
import { usePublicChainData } from "@/hooks/usePublicChainData";

const VibepoolContext = createContext<VibepoolContextValue | undefined>(undefined);

const EMPTY_PREDICTION: PredictionChainData = {
  roundId: 0n,
  higherPool: 0n,
  lowerPool: 0n,
  startPrice: 0n,
  endPrice: null,
  isRoundActive: false,
};

export function VibepoolProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const config = useConfig();
  const [chainData, setChainData] = useState<AppChainData | null>(null);

  const predictionAddr = CONTRACTS.PredictionManager.address ?? ZERO_ADDRESS;
  const predictionAbi = CONTRACTS.PredictionManager.abi;

  const { data: contractsData, refetch: refreshChainData } = useReadContracts({
    config,
    account: address,
    contracts: [
      {
        address: predictionAddr,
        abi: predictionAbi,
        functionName: "getRoundData",
        args: [],
      },
      {
        address: predictionAddr,
        abi: predictionAbi,
        functionName: "owner",
        args: [],
      },
    ],
    allowFailure: true,
    query: {
      enabled: !!address && !!isConnected && !!predictionAbi.length,
      refetchOnReconnect: true,
      refetchInterval: STALE_TIME_MS * 2,
      staleTime: STALE_TIME_MS,
    },
  });

  useEffect(() => {
    if (!isConnected || !address || !contractsData) return;

    const roundResult = contractsData[0];
    const ownerResult = contractsData[1];

    if (roundResult?.status === "success" && roundResult.result !== undefined) {
      setChainData({
        prediction: roundResult.result as PredictionChainData,
        owner:
          ownerResult?.status === "success"
            ? (ownerResult.result as Address)
            : ZERO_ADDRESS,
      });
    }
  }, [contractsData, isConnected, address]);

  const handlePublicData = useCallback((data: AppChainData) => {
    setChainData(data);
  }, []);

  usePublicChainData({
    isConnected: !!isConnected,
    address,
    predictionAddress: predictionAddr,
    predictionAbi,
    onData: handlePublicData,
  });

  const value: VibepoolContextValue = {
    isConnected: !!isConnected,
    address,
    chainData: chainData ?? {
      owner: ZERO_ADDRESS,
      prediction: EMPTY_PREDICTION,
    },
    isLoading: isConnected && !chainData,
    refreshChainData: () => {
      void refreshChainData();
    },
  };

  return (
    <VibepoolContext.Provider value={value}>{children}</VibepoolContext.Provider>
  );
}

export function useVibepool() {
  const ctx = useContext(VibepoolContext);
  if (!ctx) {
    throw new Error("useVibepool must be used within VibepoolProvider");
  }
  return ctx;
}
