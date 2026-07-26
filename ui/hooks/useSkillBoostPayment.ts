"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { encodeFunctionData, erc20Abi, type Hash } from "viem";
import { celo, celoSepolia } from "wagmi/chains";
import { CONTRACTS } from "@/lib/contracts";
import { ZERO_ADDRESS } from "@/config/constants";
import {
  CUSD_CELO,
  assetForMiniPay,
  feeForAsset,
  getSkillBoostChainId,
  getTreasuryAddress,
  type SkillBoostPurpose,
} from "@/lib/arena/skillBoost";
import { isMiniPay } from "@/lib/wagmi";
import { authFetch } from "@/lib/auth/client";

function resolveTreasury(): `0x${string}` {
  const env = getTreasuryAddress();
  if (env !== ZERO_ADDRESS) return env;
  const fromRegistry = CONTRACTS.RewardTreasury?.address;
  if (fromRegistry && fromRegistry !== ZERO_ADDRESS) return fromRegistry as `0x${string}`;
  throw new Error("Treasury address not configured");
}

export function useSkillBoostPayment() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const [pendingHash, setPendingHash] = useState<Hash | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const receipt = useWaitForTransactionReceipt({ hash: pendingHash });

  const miniPay = useMemo(() => isMiniPay(), []);
  const targetChainId = getSkillBoostChainId();
  // MiniPay + Celo mainnet → cUSD; Sepolia / non-MiniPay → native CELO
  const preferredAsset =
    targetChainId === celo.id ? assetForMiniPay(miniPay) : ("CELO" as const);

  const ensureChain = useCallback(async () => {
    if (chainId === targetChainId) return;
    const chain = targetChainId === celo.id ? celo : celoSepolia;
    await switchChainAsync({ chainId: chain.id });
  }, [chainId, targetChainId, switchChainAsync]);

  const paySkillBoost = useCallback(
    async (purpose: SkillBoostPurpose, matchId?: string) => {
      setError(null);
      setBusy(true);
      try {
        if (!isConnected || !address) throw new Error("Connect wallet to pay skill fee");

        await ensureChain();
        const treasury = resolveTreasury();
        const asset = preferredAsset;
        const amount = feeForAsset(asset);
        let hash: Hash;

        const treasuryAbi = CONTRACTS.RewardTreasury?.abi;
        if (!treasuryAbi?.length) {
          throw new Error("RewardTreasury ABI missing — sync contracts");
        }

        if (asset === "CELO") {
          // deposit() selector — payable native CELO into treasury
          const data = encodeFunctionData({
            abi: treasuryAbi,
            functionName: "deposit",
            args: [],
          });
          hash = await sendTransactionAsync({
            to: treasury,
            value: amount,
            data,
          });
        } else {
          // Approve cUSD then depositERC20
          await writeContractAsync({
            address: CUSD_CELO,
            abi: erc20Abi,
            functionName: "approve",
            args: [treasury, amount],
            chainId: targetChainId,
          });
          hash = await writeContractAsync({
            address: treasury,
            abi: treasuryAbi,
            functionName: "depositERC20",
            args: [CUSD_CELO, amount],
            chainId: targetChainId,
          });
        }

        setPendingHash(hash);

        const res = await authFetch("/api/arena/boost", {
          method: "POST",
          body: JSON.stringify({
            txHash: hash,
            asset,
            purpose,
            matchId,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to verify skill fee");
        }
        return (await res.json()) as Record<string, unknown>;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Skill fee payment failed";
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [
      address,
      ensureChain,
      isConnected,
      preferredAsset,
      sendTransactionAsync,
      targetChainId,
      writeContractAsync,
    ]
  );

  return {
    paySkillBoost,
    busy: busy || receipt.isLoading,
    error,
    preferredAsset,
    miniPay,
    feeLabel: preferredAsset === "cUSD" ? "0.01 cUSD" : "0.05 CELO",
    isConnected,
  };
}
