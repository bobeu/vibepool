import { createPublicClient, createWalletClient, encodeFunctionData, http, type Hash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "wagmi/chains";
import { CONTRACTS } from "@/lib/contracts";
import { USDM_CELO, ZERO_ADDRESS } from "@/config/constants";
import { isRuntimeEnabled } from "@/lib/runtime/productionConfig";
import { BlockchainSyncService } from "@/services/BlockchainService";
import { logger } from "@/lib/logging";

let syncService: BlockchainSyncService | null = null;

export function getBlockchainSyncService(): BlockchainSyncService {
  if (!syncService) syncService = new BlockchainSyncService();
  return syncService;
}

export function isBlockchainSettlementEnabled(): boolean {
  if (!isRuntimeEnabled("enableBlockchainSettlement")) return false;
  return Boolean(process.env.BACKEND_SIGNER_PRIVATE_KEY?.startsWith("0x"));
}

function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org";
}

export async function submitTreasuryPayout(input: {
  recipientWallet: string;
  asset: string;
  amount: number;
  requestId: string;
}): Promise<string> {
  if (!isBlockchainSettlementEnabled()) {
    const mockHash = (`0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`).padEnd(66, "0") as Hash;
    logger.warn("Blockchain settlement disabled — using mock transaction", { requestId: input.requestId });
    return mockHash;
  }

  const treasury = CONTRACTS.RewardTreasury;
  if (!treasury?.address || treasury.address === ZERO_ADDRESS) {
    throw new Error("RewardTreasury contract not configured");
  }

  const account = privateKeyToAccount(process.env.BACKEND_SIGNER_PRIVATE_KEY as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(getRpcUrl()),
  });
  const publicClient = createPublicClient({ chain: celo, transport: http(getRpcUrl()) });

  const assetAddress = input.asset === "CELO" || input.asset === "USDM" ? USDM_CELO : (input.asset as `0x${string}`);
  const requestIdBytes =
    input.requestId.startsWith("0x") && input.requestId.length === 66
      ? (input.requestId as `0x${string}`)
      : (`0x${input.requestId.replace(/-/g, "").slice(0, 64).padEnd(64, "0")}` as `0x${string}`);

  const data = encodeFunctionData({
    abi: treasury.abi,
    functionName: "payout",
    args: [input.recipientWallet as `0x${string}`, assetAddress, BigInt(input.amount), requestIdBytes],
  });

  const hash = await walletClient.sendTransaction({
    to: treasury.address,
    data,
    account,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  if (receipt.status !== "success") {
    throw new Error("Treasury payout transaction reverted");
  }

  logger.info("Treasury payout confirmed", { hash, requestId: input.requestId });
  return hash;
}

export async function pollTransactionConfirmation(txHash: string): Promise<{ confirmed: boolean; status: string }> {
  const publicClient = createPublicClient({ chain: celo, transport: http(getRpcUrl()) });
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as Hash,
      timeout: 60_000,
    });
    return { confirmed: true, status: receipt.status };
  } catch {
    return { confirmed: false, status: "pending" };
  }
}
