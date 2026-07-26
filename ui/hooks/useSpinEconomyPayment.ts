"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWriteContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWalletClient,
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
import {
  readAllowance,
  shouldUsePermit,
  signErc20Permit,
} from "@/lib/tokens/erc20Permit";

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
  const { data: walletClient } = useWalletClient();
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

  /** ERC20 spend: prefer EIP-2612 permit (1 tx), else reuse allowance, else approve+call. */
  const spendErc20 = useCallback(
    async (opts: {
      economy: `0x${string}`;
      abi: unknown;
      token: `0x${string}`;
      amount: bigint;
      withPermitFn: "payEntryWithPermit" | "purchaseItemWithPermit";
      permitArgs: readonly unknown[];
      plainFn: "payEntry" | "purchaseItem";
      plainArgs: readonly unknown[];
    }): Promise<Hash> => {
      const owner = address as `0x${string}`;
      const assetSym = opts.token; // only used for permit probe via caller

      // 1) Existing allowance → single spend tx
      const allowance = await readAllowance(opts.token, owner, opts.economy);
      if (allowance >= opts.amount) {
        return writeContractAsync({
          address: opts.economy,
          abi: opts.abi as never,
          functionName: opts.plainFn,
          args: opts.plainArgs as never,
          chainId: targetChainId,
        });
      }

      // 2) EIP-2612 permit + pull in one tx (OpenZeppelin IERC20Permit)
      if (walletClient) {
        try {
          const permit = await signErc20Permit({
            walletClient,
            owner,
            token: opts.token,
            spender: opts.economy,
            value: opts.amount,
            chainId: targetChainId,
          });
          return await writeContractAsync({
            address: opts.economy,
            abi: opts.abi as never,
            functionName: opts.withPermitFn,
            args: [...opts.permitArgs, permit.deadline, permit.v, permit.r, permit.s] as never,
            chainId: targetChainId,
          });
        } catch {
          // Token may lack permit (common for USDm/USDT) — fall through to approve
          void assetSym;
        }
      }

      // 3) Classic approve + spend (2 txs)
      await writeContractAsync({
        address: opts.token,
        abi: erc20Abi,
        functionName: "approve",
        args: [opts.economy, opts.amount],
        chainId: targetChainId,
      });
      return writeContractAsync({
        address: opts.economy,
        abi: opts.abi as never,
        functionName: opts.plainFn,
        args: opts.plainArgs as never,
        chainId: targetChainId,
      });
    },
    [address, targetChainId, walletClient, writeContractAsync]
  );

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
        const token = assetAddress(asset) as `0x${string}`;
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
          // Optional: skip permit attempt when we know asset has no EIP-2612
          const tryPermit = await shouldUsePermit(asset);
          if (!tryPermit) {
            const allowance = await readAllowance(token, address, economy);
            if (allowance < amount) {
              await writeContractAsync({
                address: token,
                abi: erc20Abi,
                functionName: "approve",
                args: [economy, amount],
                chainId: targetChainId,
              });
            }
            hash = await writeContractAsync({
              address: economy,
              abi,
              functionName: "payEntry",
              args: [token, amount, sessionRef],
              chainId: targetChainId,
            });
          } else {
            hash = await spendErc20({
              economy,
              abi,
              token,
              amount,
              withPermitFn: "payEntryWithPermit",
              permitArgs: [token, amount, sessionRef],
              plainFn: "payEntry",
              plainArgs: [token, amount, sessionRef],
            });
          }
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
      spendErc20,
      targetChainId,
      writeContractAsync,
    ]
  );

  const purchaseItem = useCallback(
    async (opts: {
      itemId: `0x${string}`;
      asset?: SpinPayAsset;
      amountWei: bigint;
    }) => {
      setError(null);
      setBusy(true);
      try {
        if (!isConnected || !address) throw new Error("Connect wallet to purchase");
        await ensureChain();
        const economy = resolveEconomy();
        const abi = CONTRACTS.SpinEconomy?.abi;
        if (!abi?.length) {
          throw new Error("SpinEconomy ABI missing — run smartContracts sync after compile");
        }

        const asset = opts.asset ?? preferredAsset;
        const amount = opts.amountWei;
        const token = assetAddress(asset) as `0x${string}`;
        let hash: Hash;

        if (asset === "CELO") {
          const data = encodeFunctionData({
            abi,
            functionName: "purchaseItem",
            args: [opts.itemId, token, amount],
          });
          hash = await sendTransactionAsync({
            to: economy,
            value: amount,
            data,
            chainId: targetChainId,
          });
        } else {
          const tryPermit = await shouldUsePermit(asset);
          if (!tryPermit) {
            const allowance = await readAllowance(token, address, economy);
            if (allowance < amount) {
              await writeContractAsync({
                address: token,
                abi: erc20Abi,
                functionName: "approve",
                args: [economy, amount],
                chainId: targetChainId,
              });
            }
            hash = await writeContractAsync({
              address: economy,
              abi,
              functionName: "purchaseItem",
              args: [opts.itemId, token, amount],
              chainId: targetChainId,
            });
          } else {
            hash = await spendErc20({
              economy,
              abi,
              token,
              amount,
              withPermitFn: "purchaseItemWithPermit",
              permitArgs: [opts.itemId, token, amount],
              plainFn: "purchaseItem",
              plainArgs: [opts.itemId, token, amount],
            });
          }
        }

        setPendingHash(hash);
        return { hash, asset, amountWei: amount.toString(), itemId: opts.itemId };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Purchase failed";
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
      spendErc20,
      targetChainId,
      writeContractAsync,
    ]
  );

  return {
    payEntry,
    purchaseItem,
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
