import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { celo } from "wagmi/chains";

export const isMiniPay = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay;
};

export const wagmiConfig = getDefaultConfig({
  appName: "Vibepool",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_ID ??
    "444e8c9b1c9d0a1e5f2b2c3d4e5f6a7",
  appDescription: "Skill-based competitive Web3 gaming on Celo",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  appIcon: "/logo.png",
  chains: [celo],
  ssr: true,
  multiInjectedProviderDiscovery: true,
  pollingInterval: 10_000,
  syncConnectedChain: true,
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_CELO_MAINNET_API),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
