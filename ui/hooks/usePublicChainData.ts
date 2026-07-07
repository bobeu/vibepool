import { useCallback, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";
import { ZERO_ADDRESS } from "@/config/constants";
import type { Address, AppChainData, PredictionChainData } from "@/types";
import { PUBLIC_DATA_REFETCH_MS } from "@/config/constants";

interface UsePublicChainDataParams {
  isConnected: boolean;
  address: Address | undefined;
  predictionAddress: Address | undefined;
  predictionAbi: readonly unknown[];
  onData: (data: AppChainData) => void;
}

/**
 * Fetches on-chain data without requiring wallet connection.
 * Mirrors vibecheck's usePublicData pattern.
 */
export function usePublicChainData({
  isConnected,
  address,
  predictionAddress,
  predictionAbi,
  onData,
}: UsePublicChainDataParams) {
  const isPublicMode = !isConnected || !address;

  const fetchPublicData = useCallback(async () => {
    if (!isPublicMode || !predictionAddress || predictionAddress === ZERO_ADDRESS) return;
    if (!predictionAbi.length) return;

    const rpcUrl =
      process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API ?? "https://forno.celo.org";

    const client = createPublicClient({
      chain: celo,
      transport: http(rpcUrl),
    });

    try {
      const [roundData, owner] = await Promise.all([
        client.readContract({
          address: predictionAddress,
          abi: predictionAbi,
          functionName: "getRoundData",
          args: [],
        }),
        client.readContract({
          address: predictionAddress,
          abi: predictionAbi,
          functionName: "owner",
        }),
      ]);

      const parsed = roundData as PredictionChainData;
      onData({
        owner: owner as Address,
        prediction: parsed,
      });
    } catch (error) {
      console.error("[usePublicChainData] fetch failed:", error);
    }
  }, [isPublicMode, predictionAddress, predictionAbi, onData]);

  useEffect(() => {
    if (!isPublicMode) return;
    fetchPublicData();
    const interval = setInterval(fetchPublicData, PUBLIC_DATA_REFETCH_MS);
    return () => clearInterval(interval);
  }, [isPublicMode, fetchPublicData]);
}
