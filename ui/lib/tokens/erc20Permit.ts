import {
  createPublicClient,
  erc20Abi,
  http,
  maxUint256,
  parseSignature,
  type Address,
  type Hex,
  type WalletClient,
} from "viem";
import { celo } from "viem/chains";
import type { SpinPayAsset } from "@/lib/tokens/celoAssets";
import { assetAddress } from "@/lib/tokens/celoAssets";

const permitAbi = [
  ...erc20Abi,
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "DOMAIN_SEPARATOR",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
] as const;

function rpcUrl(): string {
  return process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API || "https://forno.celo.org";
}

/**
 * Tokens known (or likely) to expose EIP-2612 on Celo.
 * USDC: yes. USDm/USDT: often no — runtime probe still tries DOMAIN_SEPARATOR.
 */
export function prefersPermit(asset: SpinPayAsset): boolean {
  return asset === "USDC";
}

export async function tokenSupportsPermit(token: Address): Promise<boolean> {
  try {
    const client = createPublicClient({ chain: celo, transport: http(rpcUrl()) });
    await client.readContract({
      address: token,
      abi: permitAbi,
      functionName: "DOMAIN_SEPARATOR",
    });
    await client.readContract({
      address: token,
      abi: permitAbi,
      functionName: "nonces",
      args: ["0x0000000000000000000000000000000000000001"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function readAllowance(
  token: Address,
  owner: Address,
  spender: Address
): Promise<bigint> {
  const client = createPublicClient({ chain: celo, transport: http(rpcUrl()) });
  return client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender],
  });
}

export type PermitParts = {
  deadline: bigint;
  v: number;
  r: Hex;
  s: Hex;
};

/** Off-chain EIP-2612 signature for a single on-chain *WithPermit call. */
export async function signErc20Permit(input: {
  walletClient: WalletClient;
  owner: Address;
  token: Address;
  spender: Address;
  value: bigint;
  chainId: number;
  deadlineSec?: number;
}): Promise<PermitParts> {
  const client = createPublicClient({ chain: celo, transport: http(rpcUrl()) });
  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + (input.deadlineSec ?? 30 * 60)
  );

  const [name, nonce] = await Promise.all([
    client.readContract({ address: input.token, abi: permitAbi, functionName: "name" }),
    client.readContract({
      address: input.token,
      abi: permitAbi,
      functionName: "nonces",
      args: [input.owner],
    }),
  ]);

  let version = "1";
  try {
    version = await client.readContract({
      address: input.token,
      abi: permitAbi,
      functionName: "version",
    });
  } catch {
    // OZ ERC20Permit defaults to "1"
  }

  const signature = await input.walletClient.signTypedData({
    account: input.owner,
    domain: {
      name,
      version,
      chainId: input.chainId,
      verifyingContract: input.token,
    },
    types: {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    message: {
      owner: input.owner,
      spender: input.spender,
      value: input.value,
      nonce,
      deadline,
    },
  });

  const { r, s, v, yParity } = parseSignature(signature);
  return {
    deadline,
    v: Number(v ?? 27n + BigInt(yParity ?? 0)),
    r,
    s,
  };
}

export async function shouldUsePermit(asset: SpinPayAsset): Promise<boolean> {
  if (asset === "CELO") return false;
  const token = assetAddress(asset) as Address;
  if (prefersPermit(asset)) return tokenSupportsPermit(token);
  // Probe others (USDm/USDT) — use if they expose the interface
  return tokenSupportsPermit(token);
}

export { maxUint256 };
