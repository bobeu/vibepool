import {
  createPublicClient,
  decodeEventLog,
  http,
  parseAbiItem,
  type Hash,
  type Log,
} from "viem";
import { celo } from "viem/chains";
import { CONTRACTS } from "@/lib/contracts";
import { ZERO_ADDRESS } from "@/config/constants";
import {
  assetAddress,
  getSpinPrizeVaultAddress,
  isSpinPayAsset,
  type SpinPayAsset,
} from "@/lib/spin/economy";

const rewardWithdrawnEvent = parseAbiItem(
  "event RewardWithdrawn(address indexed user, address indexed asset, uint256 amount, bytes32 indexed requestId)"
);

function rpcUrl(): string {
  return process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org";
}

export async function verifySpinWithdraw(input: {
  txHash: string;
  expectedWallet: string;
  expectedAsset: SpinPayAsset;
  expectedAmountWei: bigint;
}) {
  if (!isSpinPayAsset(input.expectedAsset)) throw new Error("Invalid withdraw asset");
  const vault = getSpinPrizeVaultAddress();
  if (!vault || vault === ZERO_ADDRESS || !CONTRACTS.SpinPrizeVault?.abi) {
    throw new Error("SpinPrizeVault not configured");
  }

  const publicClient = createPublicClient({ chain: celo, transport: http(rpcUrl()) });
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: input.txHash as Hash,
    timeout: 90_000,
  });
  if (receipt.status !== "success") throw new Error("Withdraw transaction failed");
  if ((receipt.from ?? "").toLowerCase() !== input.expectedWallet.toLowerCase()) {
    throw new Error("Withdraw sender does not match session wallet");
  }

  const expectedAsset = assetAddress(input.expectedAsset).toLowerCase();
  for (const log of receipt.logs as Log[]) {
    if (log.address.toLowerCase() !== vault.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: [rewardWithdrawnEvent],
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== "RewardWithdrawn") continue;
      const user = String(decoded.args.user).toLowerCase();
      const asset = String(decoded.args.asset).toLowerCase();
      const amount = decoded.args.amount as bigint;
      if (
        user === input.expectedWallet.toLowerCase() &&
        asset === expectedAsset &&
        amount === input.expectedAmountWei
      ) {
        return { txHash: input.txHash, amountWei: amount.toString() };
      }
    } catch {
      // Ignore unrelated vault logs.
    }
  }
  throw new Error("RewardWithdrawn event not found");
}
