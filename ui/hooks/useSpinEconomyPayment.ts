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
import { encodeFunctionData, erc20Abi, type Hash, keccak256, stringToBytes } from "viem";
import { celo } from "wagmi/chains";
import { CONTRACTS } from "@/lib/contracts";
import { ZERO_ADDRESS } from "@/config/constants";
import {
  assetAddress,
  defaultEntryFee,
  getSpinEconomyAddress,
  getSpinHuntChainId,
  preferredEntryAsset,
  type SpinPayAsset,
} from "@/lib/spin/economy";
import { isMiniPay } from "@/lib/wagmi";

function resolveEconomy(): `0x${string}` {
  const addr = getSpinEconomyAddress();
  if (addr !== ZERO_ADDRESS) return addr;
  throw new Error("SpinEconomy not configured — set NEXT_PUBLIC_SPIN_ECONOMY_ADDRESS after mainnet deploy");
}

/** Random sessionRef for payEntry → start Session linkage. */
export function createSessionRef(): `0x${string}` {
  return keccak256(stringToBytes(`${Date.now()}-${Math.random()}`));
}

export function useSpinEconomyPayment() {
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
  const targetChainId = getSpinHuntChainId();
  const preferredAsset = preferredEntryAsset(miniPay);

  const ensureChain = useCallback(async () => {
    if (chainId === celo.id) return;
    await switchChainAsync({ chainId: celo.id });
  }, [chainId, switchChainAsync]);

  const payEntry = useCallback(
    async (opts?: { asset?: SpinPayAsset; amountWei?: bigint; sessionRef?: `0x${string}` }) => {
      setError(null);
      setBusy(true);
      try {
        if (!isConnected || !address) throw new Error("Connect wallet to pay entry");

        await ensureChain();
        const economy = resolveEconomy();
        const abi = CONTRACTS.SpinEconomy?.abi;
        if (!abi?.length) {
          throw new Error("SpinEconomy ABI missing — run smartContracts sync after compile");
        }

        const asset = opts?.asset ?? preferredAsset;
        const amount = opts?.amountWei ?? defaultEntryFee(asset);
        const sessionRef = opts?.sessionRef ?? createSessionRef();
        const token = assetAddress(asset);
        let hash: Hash;

        if (asset === "CELO") {
          const data = encodeFunctionData({
            abi,
            functionName: "payEntry",
            args: [token, amount, sessionRef],
          });
          hash = await sendTransactionAsync({
            to: economy,
            value: amount,
            data,
            chainId: targetChainId,
          });
        } else {
          await writeContractAsync({
            address: token as `0x${string}`,
            abi: erc20Abi,
            functionName: "approve",
            args: [economy, amount],
            chainId: targetChainId,
          });
          hash = await writeContractAsync({
            address: economy,
            abi,
            functionName: "payEntry",
            args: [token, amount, sessionRef],
            chainId: targetChainId,
          });
        }

        setPendingHash(hash);
        return { hash, sessionRef, asset, amountWei: amount.toString() };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Entry payment failed";
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
    payEntry,
    createSessionRef,
    busy: busy || receipt.isLoading,
    error,
    preferredAsset,
    miniPay,
    feeLabel:
      preferredAsset === "USDm"
        ? "0.01 USDm"
        : preferredAsset === "CELO"
          ? "0.05 CELO"
          : `entry ${preferredAsset}`,
    isConnected,
  };
}
