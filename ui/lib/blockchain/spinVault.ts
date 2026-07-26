import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  type Hash,
  type Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "wagmi/chains";
import { CONTRACTS } from "@/lib/contracts";
import { ZERO_ADDRESS } from "@/config/constants";
import { assetAddress, type SpinPayAsset } from "@/lib/tokens/celoAssets";
import { logger } from "@/lib/logging";

function rpcUrl(): string {
  return process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org";
}

function dbManagerKey(): `0x${string}` | null {
  const key =
    process.env.DB_MANAGER_PRIVATE_KEY?.trim() ||
    process.env.BACKEND_SIGNER_PRIVATE_KEY?.trim();
  if (key?.startsWith("0x") && key.length >= 66) return key as `0x${string}`;
  return null;
}

export function isDbManagerEnabled(): boolean {
  return Boolean(dbManagerKey() && CONTRACTS.SpinPrizeVault?.address !== ZERO_ADDRESS);
}

/** Credit claimable reward on SpinPrizeVault via DB_MANAGER key. */
export async function creditSpinReward(input: {
  wallet: string;
  asset: SpinPayAsset;
  amountWei: bigint;
  requestId: `0x${string}`;
}): Promise<{ hash: Hash } | { error: string }> {
  const vault = CONTRACTS.SpinPrizeVault;
  if (!vault?.address || vault.address === ZERO_ADDRESS || !vault.abi) {
    return { error: "SpinPrizeVault not configured" };
  }
  const key = dbManagerKey();
  if (!key) return { error: "DB_MANAGER_PRIVATE_KEY not set" };

  try {
    const account = privateKeyToAccount(key);
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(rpcUrl()),
    });
    const publicClient = createPublicClient({ chain: celo, transport: http(rpcUrl()) });

    const data = encodeFunctionData({
      abi: vault.abi as Abi,
      functionName: "creditReward",
      args: [
        input.wallet as `0x${string}`,
        assetAddress(input.asset),
        input.amountWei,
        input.requestId,
      ],
    });

    const hash = await walletClient.sendTransaction({
      to: vault.address as `0x${string}`,
      data,
      account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") {
      return { error: "creditReward transaction reverted" };
    }
    logger.info("SpinPrizeVault creditReward confirmed", { hash, requestId: input.requestId });
    return { hash };
  } catch (e) {
    const message = e instanceof Error ? e.message : "creditReward failed";
    logger.error("creditSpinReward failed", { message });
    return { error: message };
  }
}

export async function readVaultCanWithdraw(
  wallet: string,
  asset: SpinPayAsset,
  amountWei: bigint
): Promise<boolean> {
  const vault = CONTRACTS.SpinPrizeVault;
  if (!vault?.address || vault.address === ZERO_ADDRESS || !vault.abi) return false;
  try {
    const publicClient = createPublicClient({ chain: celo, transport: http(rpcUrl()) });
    return (await publicClient.readContract({
      address: vault.address as `0x${string}`,
      abi: vault.abi as Abi,
      functionName: "canWithdraw",
      args: [wallet as `0x${string}`, assetAddress(asset), amountWei],
    })) as boolean;
  } catch {
    return false;
  }
}
