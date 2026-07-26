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

const entryPaidEvent = parseAbiItem(
  "event EntryPaid(address indexed user, address indexed asset, uint256 amount, uint256 treasuryShare, uint256 vaultShare, bytes32 indexed sessionRef)"
);

function rpcForMainnet(): string {
  return process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org";
}

export type VerifiedSpinEntry = {
  txHash: string;
  asset: SpinPayAsset;
  amountWei: string;
  sessionRef: `0x${string}`;
  from: string;
};

/**
 * Verifies SpinEconomy.payEntry on Celo mainnet (contract-only entry fee).
 */
export async function verifySpinEntry(input: {
  txHash: string;
  expectedFrom: string;
  expectedAsset: SpinPayAsset;
  expectedSessionRef: `0x${string}`;
  minAmountWei: bigint;
}): Promise<VerifiedSpinEntry> {
  if (!isSpinPayAsset(input.expectedAsset)) {
    throw new Error("Invalid entry asset");
  }

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
    throw new Error("Entry payment transaction failed on-chain");
  }

  const from = (receipt.from ?? "").toLowerCase();
  if (from !== input.expectedFrom.toLowerCase()) {
    throw new Error("Transaction sender does not match session wallet");
  }

  const expectedAssetAddr = assetAddress(input.expectedAsset).toLowerCase();
  let matchedAmount = 0n;
  let matchedRef: `0x${string}` | null = null;
  let matchedAsset: SpinPayAsset | null = null;

  for (const log of receipt.logs as Log[]) {
    if (log.address.toLowerCase() !== economy.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [entryPaidEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "EntryPaid") continue;

      const user = String(decoded.args.user).toLowerCase();
      const asset = String(decoded.args.asset).toLowerCase();
      const amount = decoded.args.amount as bigint;
      const sessionRef = decoded.args.sessionRef as `0x${string}`;

      if (user !== from) continue;
      if (sessionRef.toLowerCase() !== input.expectedSessionRef.toLowerCase()) continue;
      if (asset !== expectedAssetAddr) continue;

      matchedAmount = amount;
      matchedRef = sessionRef;
      matchedAsset = symbolFromAddress(asset) ?? input.expectedAsset;
      break;
    } catch {
      // ignore non-matching logs
    }
  }

  if (!matchedRef || !matchedAsset) {
    throw new Error("EntryPaid event not found for this session");
  }
  if (matchedAmount < input.minAmountWei) {
    throw new Error("Entry fee below required amount");
  }

  return {
    txHash: input.txHash,
    asset: matchedAsset,
    amountWei: matchedAmount.toString(),
    sessionRef: matchedRef,
    from,
  };
}
