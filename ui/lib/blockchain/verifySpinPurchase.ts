import {
  createPublicClient,
  decodeEventLog,
  http,
  type Hash,
  type Log,
  parseAbiItem,
} from "viem";
import { celo } from "viem/chains";
import { CONTRACTS } from "@/lib/contracts";
import { ZERO_ADDRESS } from "@/config/constants";
import {
  assetAddress,
  getSpinEconomyAddress,
  getSpinHuntChainId,
  isSpinPayAsset,
  type SpinPayAsset,
} from "@/lib/spin/economy";
import { symbolFromAddress } from "@/lib/tokens/celoAssets";

const itemPurchasedEvent = parseAbiItem(
  "event ItemPurchased(address indexed user, bytes32 indexed itemId, address indexed asset, uint256 amount, uint256 treasuryShare, uint256 vaultShare)"
);

function rpcForMainnet(): string {
  return process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org";
}

export type VerifiedSpinPurchase = {
  txHash: string;
  asset: SpinPayAsset;
  amountWei: string;
  itemId: `0x${string}`;
  from: string;
};

export async function verifySpinPurchase(input: {
  txHash: string;
  expectedFrom: string;
  expectedItemId: `0x${string}`;
  expectedAsset: SpinPayAsset;
  minAmountWei: bigint;
}): Promise<VerifiedSpinPurchase> {
  if (!isSpinPayAsset(input.expectedAsset)) throw new Error("Invalid purchase asset");

  const economy =
    getSpinEconomyAddress() !== ZERO_ADDRESS
      ? getSpinEconomyAddress()
      : (CONTRACTS.SpinEconomy?.address as `0x${string}` | undefined);

  if (!economy || economy === ZERO_ADDRESS) {
    throw new Error("SpinEconomy not configured");
  }
  if (getSpinHuntChainId() !== celo.id) {
    throw new Error("Spin Hunt is mainnet-only");
  }

  const publicClient = createPublicClient({
    chain: celo,
    transport: http(rpcForMainnet()),
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: input.txHash as Hash,
    timeout: 90_000,
  });
  if (receipt.status !== "success") {
    throw new Error("Purchase transaction failed on-chain");
  }

  const from = (receipt.from ?? "").toLowerCase();
  if (from !== input.expectedFrom.toLowerCase()) {
    throw new Error("Transaction sender does not match session wallet");
  }

  const expectedAssetAddr = assetAddress(input.expectedAsset).toLowerCase();
  let matchedAmount = 0n;
  let matchedItem: `0x${string}` | null = null;
  let matchedAsset: SpinPayAsset | null = null;

  for (const log of receipt.logs as Log[]) {
    if (log.address.toLowerCase() !== economy.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [itemPurchasedEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "ItemPurchased") continue;
      const user = String(decoded.args.user).toLowerCase();
      const itemId = decoded.args.itemId as `0x${string}`;
      const asset = String(decoded.args.asset).toLowerCase();
      const amount = decoded.args.amount as bigint;
      if (user !== from) continue;
      if (itemId.toLowerCase() !== input.expectedItemId.toLowerCase()) continue;
      if (asset !== expectedAssetAddr) continue;
      matchedAmount = amount;
      matchedItem = itemId;
      matchedAsset = symbolFromAddress(asset) ?? input.expectedAsset;
      break;
    } catch {
      // ignore
    }
  }

  if (!matchedItem || !matchedAsset) {
    throw new Error("ItemPurchased event not found");
  }
  if (matchedAmount < input.minAmountWei) {
    throw new Error("Purchase amount below catalog price");
  }

  return {
    txHash: input.txHash,
    asset: matchedAsset,
    amountWei: matchedAmount.toString(),
    itemId: matchedItem,
    from,
  };
}
